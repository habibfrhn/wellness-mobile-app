import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "MISSING_AUTHORIZATION"
  | "INVALID_SESSION"
  | "INVALID_PAYLOAD"
  | "EMAIL_MISMATCH"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMITED"
  | "RATE_LIMIT_FAILED"
  | "RESEND_FAILED";

type ResendBody = {
  email?: string;
  redirectTo?: string;
};

const ACTION_RESEND_COOLDOWN = "resend_verification_email_cooldown";
const ACTION_RESEND_HOURLY = "resend_verification_email_hourly";
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESENDS_PER_HOUR = 5;

const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

function json(status: number, body: Record<string, unknown>, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function fail(status: number, message: string, code: ErrorCode, corsHeaders: Record<string, string>) {
  return json(status, { ok: false, error: message, code }, corsHeaders);
}

function getAllowedCorsOrigin(req: Request) {
  const requestOrigin = req.headers.get("origin");
  if (!requestOrigin) {
    return null;
  }

  const configuredAllowedOrigins = (Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredAllowedOrigins.length === 0) {
    return "*";
  }

  return configuredAllowedOrigins.includes(requestOrigin) ? requestOrigin : null;
}

function buildCorsHeaders(req: Request) {
  const allowedOrigin = getAllowedCorsOrigin(req);
  return {
    ...baseCorsHeaders,
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
  };
}

function getBearerToken(req: Request): string {
  const authorization = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7);
}

function getCooldownBucket(date: Date) {
  return `60s:${Math.floor(date.getTime() / 60_000)}`;
}

function getHourBucket(date: Date) {
  const bucketDate = new Date(date);
  bucketDate.setUTCMinutes(0, 0, 0);
  return `1h:${bucketDate.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

function getSecondsUntilNextHour(date: Date) {
  return 3600 - (date.getUTCMinutes() * 60 + date.getUTCSeconds());
}

function isSafeRedirectUrl(value: string) {
  try {
    const parsed = new URL(value);
    const isHttps = parsed.protocol === "https:";
    const isLocalHttp = parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
    return isHttps || isLocalHttp;
  } catch {
    return false;
  }
}

async function incrementRateLimit(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  bucket: string
): Promise<number> {
  const { data, error } = await adminClient.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_bucket: bucket,
  });

  if (error || typeof data !== "number") {
    throw new Error("RATE_LIMIT_FAILED");
  }

  return data;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.headers.get("origin") && !corsHeaders["Access-Control-Allow-Origin"]) {
    return fail(403, "Origin not allowed", "METHOD_NOT_ALLOWED", corsHeaders);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return fail(405, "Method not allowed", "METHOD_NOT_ALLOWED", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return fail(500, "Server misconfiguration", "SERVER_MISCONFIGURATION", corsHeaders);
  }

  const bearerToken = getBearerToken(req);
  if (!bearerToken) {
    return fail(401, "Missing Authorization bearer token", "MISSING_AUTHORIZATION", corsHeaders);
  }

  let payload: ResendBody;
  try {
    payload = (await req.json()) as ResendBody;
  } catch {
    return fail(400, "Invalid JSON body", "INVALID_JSON", corsHeaders);
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  if (!email) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const redirectTo = typeof payload.redirectTo === "string" && payload.redirectTo.trim().length > 0
    ? payload.redirectTo.trim()
    : null;

  if (redirectTo && !isSafeRedirectUrl(redirectTo)) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${bearerToken}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user?.id || !user.email) {
    return fail(401, "Invalid user session", "INVALID_SESSION", corsHeaders);
  }

  if (user.email.toLowerCase() !== email) {
    return fail(403, "Email does not match current user", "EMAIL_MISMATCH", corsHeaders);
  }

  const now = new Date();

  try {
    const cooldownCount = await incrementRateLimit(adminClient, user.id, ACTION_RESEND_COOLDOWN, getCooldownBucket(now));
    if (cooldownCount > 1) {
      return json(429, { ok: false, code: "RATE_LIMITED", retryAfterSec: RESEND_COOLDOWN_SECONDS }, corsHeaders);
    }

    const hourlyCount = await incrementRateLimit(adminClient, user.id, ACTION_RESEND_HOURLY, getHourBucket(now));
    if (hourlyCount > MAX_RESENDS_PER_HOUR) {
      return json(429, { ok: false, code: "RATE_LIMITED", retryAfterSec: getSecondsUntilNextHour(now) }, corsHeaders);
    }
  } catch {
    return fail(503, "Service temporarily unavailable", "RATE_LIMIT_FAILED", corsHeaders);
  }

  const { error: resendError } = await userClient.auth.resend({
    type: "signup",
    email,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });

  if (resendError) {
    const normalizedMessage = resendError.message.toLowerCase();
    const isRateLimited =
      normalizedMessage.includes("rate limit") ||
      normalizedMessage.includes("too many") ||
      normalizedMessage.includes("over_email_send_rate_limit") ||
      normalizedMessage.includes("over_request_rate_limit");

    if (isRateLimited) {
      return json(429, { ok: false, code: "RATE_LIMITED", retryAfterSec: RESEND_COOLDOWN_SECONDS }, corsHeaders);
    }

    return fail(500, "Failed to resend verification email", "RESEND_FAILED", corsHeaders);
  }

  return json(200, { ok: true, cooldownSec: RESEND_COOLDOWN_SECONDS }, corsHeaders);
});
