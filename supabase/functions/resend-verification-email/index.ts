import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMITED"
  | "LINK_STILL_VALID"
  | "RATE_LIMIT_FAILED"
  | "RESEND_FAILED";

type ResendBody = {
  email?: string;
  redirectTo?: string;
};

const ACTION_RESEND_COOLDOWN = "resend_verification_email_cooldown";
const ACTION_RESEND_VALID_WINDOW = "resend_verification_email_valid_window";
const RESEND_COOLDOWN_SECONDS = 60;
const LINK_VALID_WINDOW_SECONDS = 3600;

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

function getCooldownBucket(date: Date) {
  return `60s:${Math.floor(date.getTime() / 60_000)}`;
}

function getValidWindowBucket(date: Date) {
  const bucketDate = new Date(date);
  bucketDate.setUTCMinutes(0, 0, 0);
  return `1h:${bucketDate.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

function getSecondsUntilWindowReset(date: Date) {
  return LINK_VALID_WINDOW_SECONDS - (date.getUTCMinutes() * 60 + date.getUTCSeconds());
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

function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const firstIp = xff.split(",")[0]?.trim();
  if (firstIp) {
    return firstIp;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function incrementRateLimit(
  adminClient: ReturnType<typeof createClient>,
  principalKey: string,
  action: string,
  bucket: string
): Promise<number> {
  const { data, error } = await adminClient.rpc("increment_analytics_ingest_rate_limit", {
    p_principal_key: principalKey,
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
  console.log("resend-verification-email: request", { method: req.method, origin: req.headers.get("origin") ?? null });

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

  let payload: ResendBody;
  try {
    payload = (await req.json()) as ResendBody;
  } catch {
    return fail(400, "Invalid JSON body", "INVALID_JSON", corsHeaders);
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  const emailPreview = email ? `${email.slice(0, 3)}***` : null;
  if (!email) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const redirectTo = typeof payload.redirectTo === "string" && payload.redirectTo.trim().length > 0
    ? payload.redirectTo.trim()
    : null;

  if (redirectTo && !isSafeRedirectUrl(redirectTo)) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const now = new Date();
  const principalKey = await sha256(`${email}|${getClientIp(req)}`);

  let rateLimitUnavailable = false;
  try {
    const cooldownCount = await incrementRateLimit(adminClient, principalKey, ACTION_RESEND_COOLDOWN, getCooldownBucket(now));
    if (cooldownCount > 1) {
      console.warn("resend-verification-email: cooldown limited", { emailPreview });
      return json(429, { ok: false, code: "RATE_LIMITED", retryAfterSec: RESEND_COOLDOWN_SECONDS }, corsHeaders);
    }

    const windowCount = await incrementRateLimit(adminClient, principalKey, ACTION_RESEND_VALID_WINDOW, getValidWindowBucket(now));
    if (windowCount > 1) {
      console.log("resend-verification-email: link still valid", { emailPreview });
      return json(409, { ok: false, code: "LINK_STILL_VALID", retryAfterSec: getSecondsUntilWindowReset(now) }, corsHeaders);
    }
  } catch (error) {
    rateLimitUnavailable = true;
    console.error("resend-verification-email: rate-limit subsystem unavailable, falling back to auth provider limits", {
      emailPreview,
      error,
    });
  }

  const { error: resendError } = await anonClient.auth.resend({
    type: "signup",
    email,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });

  if (resendError) {
    console.error("resend-verification-email: resend failed", { emailPreview, message: resendError.message });
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

  console.log("resend-verification-email: resend success", { emailPreview, rateLimitUnavailable });
  return json(200, { ok: true, cooldownSec: RESEND_COOLDOWN_SECONDS }, corsHeaders);
});
