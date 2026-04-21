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
type TrackAnalyticsBatchBody = {
  events: TrackAnalyticsEventBody[];
};

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "ORIGIN_NOT_ALLOWED"
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
const MAX_EVENTS_PER_REQUEST = 25;
const EVENT_PROP_ID_REGEX = /^[A-Za-z0-9_-]+$/;
const REQUIRED_WEB_ORIGINS = ["https://www.lumepo.com", "https://lumepo.com"];

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
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

function json(status: number, body: Record<string, unknown>, requestCorsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...requestCorsHeaders },
  });
}

function error(status: number, message: string, code: ErrorCode, requestCorsHeaders: Record<string, string>) {
  return json(status, { ok: false, error: message, code }, requestCorsHeaders);
}

function getAllowedCorsOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    return null;
  }

  const normalizedOrigin = origin.trim().toLowerCase();

  const allowedOriginsRaw = Deno.env.get("CORS_ALLOWED_ORIGINS")?.trim();
  if (!allowedOriginsRaw) {
    return REQUIRED_WEB_ORIGINS.includes(normalizedOrigin) ? origin : null;
  }

  const allowedOrigins = allowedOriginsRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (allowedOrigins.includes("*")) {
    return "*";
  }

  const expandedAllowedOrigins = Array.from(new Set([...allowedOrigins, ...REQUIRED_WEB_ORIGINS]));

  return expandedAllowedOrigins.includes(normalizedOrigin) ? origin : null;
}

function buildCorsHeaders(req: Request) {
  const allowedOrigin = getAllowedCorsOrigin(req);
  return {
    ...corsHeaders,
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
  };
}

function getAuthorizationToken(req: Request): string {
  const userJwtHeader = req.headers.get("x-user-jwt")?.trim();
  if (userJwtHeader) {
    return userJwtHeader;
  }

  const authorization = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) {
    const bearerToken = authorization.slice(7);
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (anonKey && bearerToken === anonKey) {
      return "";
    }

    return bearerToken;
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
  const eventPropKeys = Object.keys(eventProps);
  if (eventPropKeys.length > 1) {
    return false;
  }

  if (
    payload.event_name === "audio_click" ||
    payload.event_name === "audio_play" ||
    payload.event_name === "audio_complete" ||
    payload.event_name === "audio_abandon"
  ) {
    return (
      typeof eventProps.audio_id === "string" &&
      eventProps.audio_id.trim().length > 0 &&
      eventProps.audio_id.trim().length <= 120 &&
      EVENT_PROP_ID_REGEX.test(eventProps.audio_id.trim())
    );
  }

  if (payload.event_name === "tailored_session_select") {
    return eventProps.session_mode === "calm_mind" || eventProps.session_mode === "release_accept";
  }

  if (
    payload.event_name === "tailored_session_start" ||
    payload.event_name === "tailored_session_complete" ||
    payload.event_name === "tailored_session_dropoff"
  ) {
    if (eventPropKeys.length === 0) {
      return true;
    }

    return eventProps.session_mode === "calm_mind" || eventProps.session_mode === "release_accept";
  }

  return Object.keys(eventProps).length === 0;
}

function parsePayloadEvents(value: unknown): TrackAnalyticsEventBody[] | null {
  if (isValidPayload(value)) {
    return [value];
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const batch = value as Partial<TrackAnalyticsBatchBody>;
  if (!Array.isArray(batch.events) || batch.events.length === 0 || batch.events.length > MAX_EVENTS_PER_REQUEST) {
    return null;
  }

  if (!batch.events.every((item) => isValidPayload(item))) {
    return null;
  }

  return batch.events;
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

async function incrementRateLimitWithFallback(
  adminClient: ReturnType<typeof createClient>,
  principalKey: string,
  action: string,
  bucket: string,
  eventCount: number
) {
  const primary = await adminClient.rpc("increment_analytics_ingest_rate_limit", {
    p_principal_key: principalKey,
    p_action: action,
    p_bucket: bucket,
    p_increment: eventCount,
  });

  if (!primary.error && typeof primary.data === "number") {
    return primary;
  }

  const fallback = await adminClient.rpc("increment_analytics_ingest_rate_limit", {
    p_principal_key: principalKey,
    p_action: action,
    p_bucket: bucket,
  });

  if (fallback.error || typeof fallback.data !== "number") {
    return primary;
  }

  return fallback;
}

Deno.serve(async (req: Request) => {
  const requestCorsHeaders = buildCorsHeaders(req);

  if (req.headers.get("origin") && !requestCorsHeaders["Access-Control-Allow-Origin"]) {
    return new Response(
      JSON.stringify({ ok: false, error: "Origin not allowed", code: "ORIGIN_NOT_ALLOWED" }),
      { status: 403, headers: { "Content-Type": "application/json", ...requestCorsHeaders } },
    );
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: requestCorsHeaders });
  }

  if (req.method !== "POST") {
    return error(405, "Method not allowed", "METHOD_NOT_ALLOWED", requestCorsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("track-analytics-event: missing environment variables");
    return error(500, "Server misconfiguration", "SERVER_MISCONFIGURATION", requestCorsHeaders);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return error(400, "Invalid JSON body", "INVALID_JSON", requestCorsHeaders);
  }

  const payloadEvents = parsePayloadEvents(payload);
  if (!payloadEvents) {
    return error(400, "Invalid request payload", "INVALID_PAYLOAD", requestCorsHeaders);
  }

  const token = getAuthorizationToken(req);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  let userId: string | null = null;
  if (token) {
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user?.id) {
      console.info("track-analytics-event: invalid user jwt, falling back to anonymous principal");
    } else {
      userId = userData.user.id;
    }
  }

  const principalKey = userId ? `user:${userId}` : await getAnonPrincipalKey(req);
  const bucket = getMinuteBucket(new Date());
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: incrementedCount, error: rateLimitError } = await incrementRateLimitWithFallback(
    adminClient,
    principalKey,
    ACTION_NAME,
    bucket,
    payloadEvents.length
  );

  const hasRateLimitCounter = !rateLimitError && typeof incrementedCount === "number";
  if (!hasRateLimitCounter) {
    console.error("track-analytics-event: rate limit increment unavailable", rateLimitError);
    return error(503, "Service temporarily unavailable", "RATE_LIMIT_FAILED", requestCorsHeaders);
  }

  if (hasRateLimitCounter) {
    const maxPerMinute = userId ? MAX_REQUESTS_PER_MINUTE_AUTH : MAX_REQUESTS_PER_MINUTE_ANON;
    if ((incrementedCount as number) > maxPerMinute) {
      return error(429, "Too many requests", "RATE_LIMITED", requestCorsHeaders);
    }
  }

  const rows = payloadEvents.map((eventPayload) => ({
    event_name: eventPayload.event_name,
    event_props: eventPayload.event_props,
    session_id: eventPayload.session_id,
    user_id: userId,
  }));

  const { error: insertError } = await adminClient.from("analytics_events").insert(rows);

  if (insertError) {
    console.error("track-analytics-event: insert failed", insertError);
    return error(500, "Failed to track event", "INSERT_FAILED", requestCorsHeaders);
  }

  return json(200, { ok: true, received: payloadEvents.length }, requestCorsHeaders);
});
