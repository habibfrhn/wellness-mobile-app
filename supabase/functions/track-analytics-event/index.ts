import { createClient } from "supabase";

type AnalyticsEventName =
  | "landing_page_view"
  | "landing_cta_click"
  | "home_sleep_cta_click"
  | "audio_click"
  | "signup_start"
  | "signup_complete"
  | "audio_play"
  | "audio_complete"
  | "audio_abandon"
  | "tailored_session_select"
  | "tailored_session_start"
  | "tailored_session_complete"
  | "tailored_session_dropoff";

type TrackAnalyticsEventBody = {
  event_name: AnalyticsEventName;
  event_props: Record<string, unknown>;
  session_id: string;
};

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "INVALID_SESSION"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMIT_FAILED"
  | "RATE_LIMITED"
  | "INSERT_FAILED";

const ACTION_NAME = "track_analytics_event";
const MAX_REQUESTS_PER_MINUTE_ANON = 45;
const MAX_REQUESTS_PER_MINUTE_AUTH = 90;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVENT_NAMES: AnalyticsEventName[] = [
  "landing_page_view",
  "landing_cta_click",
  "home_sleep_cta_click",
  "audio_click",
  "signup_start",
  "signup_complete",
  "audio_play",
  "audio_complete",
  "audio_abandon",
  "tailored_session_select",
  "tailored_session_start",
  "tailored_session_complete",
  "tailored_session_dropoff",
];

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function error(status: number, message: string, code: ErrorCode) {
  return json(status, { ok: false, error: message, code });
}

function getAuthorizationToken(req: Request): string {
  const authorization = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return "";
}

function getMinuteBucket(date: Date): string {
  const bucketDate = new Date(date);
  bucketDate.setUTCSeconds(0, 0);
  return `1min:${bucketDate.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

function isValidPayload(value: unknown): value is TrackAnalyticsEventBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<TrackAnalyticsEventBody>;
  if (!EVENT_NAMES.includes(payload.event_name as AnalyticsEventName)) {
    return false;
  }

  if (typeof payload.session_id !== "string") {
    return false;
  }

  const normalizedSessionId = payload.session_id.trim();
  if (normalizedSessionId.length < 8 || normalizedSessionId.length > 128) {
    return false;
  }

  if (!payload.event_props || typeof payload.event_props !== "object" || Array.isArray(payload.event_props)) {
    return false;
  }

  const eventProps = payload.event_props as Record<string, unknown>;

  if (
    payload.event_name === "audio_click" ||
    payload.event_name === "audio_play" ||
    payload.event_name === "audio_complete" ||
    payload.event_name === "audio_abandon"
  ) {
    return typeof eventProps.audio_id === "string" && eventProps.audio_id.trim().length > 0;
  }

  if (
    payload.event_name === "tailored_session_select" ||
    payload.event_name === "tailored_session_start" ||
    payload.event_name === "tailored_session_complete" ||
    payload.event_name === "tailored_session_dropoff"
  ) {
    return eventProps.session_mode === "calm_mind" || eventProps.session_mode === "release_accept";
  }

  return Object.keys(eventProps).length === 0;
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getAnonPrincipalKey(req: Request) {
  const ipRaw = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ?? "unknown";
  const hashedIp = await sha256Hex(ipRaw || "unknown");
  return `anon:${hashedIp}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return error(405, "Method not allowed", "METHOD_NOT_ALLOWED");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("track-analytics-event: missing environment variables");
    return error(500, "Server misconfiguration", "SERVER_MISCONFIGURATION");
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return error(400, "Invalid JSON body", "INVALID_JSON");
  }

  if (!isValidPayload(payload)) {
    return error(400, "Invalid request payload", "INVALID_PAYLOAD");
  }

  const token = getAuthorizationToken(req);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  let userId: string | null = null;
  if (token) {
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user?.id) {
      return error(401, "Invalid user session", "INVALID_SESSION");
    }

    userId = userData.user.id;
  }

  const principalKey = userId ? `user:${userId}` : await getAnonPrincipalKey(req);
  const bucket = getMinuteBucket(new Date());
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: incrementedCount, error: rateLimitError } = await adminClient.rpc(
    "increment_analytics_ingest_rate_limit",
    {
      p_principal_key: principalKey,
      p_action: ACTION_NAME,
      p_bucket: bucket,
    }
  );

  if (rateLimitError || typeof incrementedCount !== "number") {
    console.error("track-analytics-event: rate limit increment failed", rateLimitError);
    return error(500, "Failed to process rate limit", "RATE_LIMIT_FAILED");
  }

  const maxPerMinute = userId ? MAX_REQUESTS_PER_MINUTE_AUTH : MAX_REQUESTS_PER_MINUTE_ANON;
  if (incrementedCount > maxPerMinute) {
    return error(429, "Too many requests", "RATE_LIMITED");
  }

  const { error: insertError } = await adminClient.from("analytics_events").insert({
    event_name: payload.event_name,
    event_props: payload.event_props,
    session_id: payload.session_id,
    user_id: userId,
  });

  if (insertError) {
    console.error("track-analytics-event: insert failed", insertError);
    return error(500, "Failed to track event", "INSERT_FAILED");
  }

  return json(200, { ok: true });
});
