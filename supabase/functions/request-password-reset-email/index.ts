import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMITED"
  | "RESET_REQUEST_FAILED"
  | "RESET_REQUEST_ACCEPTED";

type ResetBody = {
  email?: string;
  redirectTo?: string;
};

const ACTION_FORGOT_PASSWORD_COOLDOWN = "forgot_password_email_cooldown";
const FORGOT_PASSWORD_COOLDOWN_SECONDS = 60;
const REQUIRED_WEB_ORIGINS = ["https://www.lumepo.com", "https://lumepo.com"];
const LOCAL_DEV_ORIGINS = ["http://localhost:8081", "http://127.0.0.1:8081"];
const VERCEL_PREVIEW_ORIGIN_REGEX = /^https:\/\/wellness-mobile-[a-z0-9-]+\.vercel\.app$/i;

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
  const allowedOrigins = Array.from(new Set([...configuredAllowedOrigins, ...REQUIRED_WEB_ORIGINS, ...LOCAL_DEV_ORIGINS]));

  if (allowedOrigins.includes(requestOrigin) || VERCEL_PREVIEW_ORIGIN_REGEX.test(requestOrigin)) {
    return requestOrigin;
  }

  return null;
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

async function incrementRateLimit(adminClient: ReturnType<typeof createClient>, principalKey: string, action: string, bucket: string): Promise<number> {
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

function isRateLimitedProviderError(message: string | null | undefined) {
  const normalizedMessage = (message ?? "").toLowerCase();
  return (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many") ||
    normalizedMessage.includes("over_email_send_rate_limit") ||
    normalizedMessage.includes("over_request_rate_limit")
  );
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

  let payload: ResetBody;
  try {
    payload = (await req.json()) as ResetBody;
  } catch {
    return fail(400, "Invalid JSON body", "INVALID_JSON", corsHeaders);
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  if (!email) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const redirectTo = typeof payload.redirectTo === "string" && payload.redirectTo.trim().length > 0 ? payload.redirectTo.trim() : null;
  if (redirectTo && !isSafeRedirectUrl(redirectTo)) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const principalKey = await sha256(`${email}|${getClientIp(req)}`);

  try {
    const cooldownCount = await incrementRateLimit(adminClient, principalKey, ACTION_FORGOT_PASSWORD_COOLDOWN, getCooldownBucket(new Date()));
    if (cooldownCount > 1) {
      return json(429, { ok: false, code: "RATE_LIMITED", retryAfterSec: FORGOT_PASSWORD_COOLDOWN_SECONDS }, corsHeaders);
    }
  } catch (error) {
    const rateLimitMessage = error instanceof Error ? error.message : String(error);
    console.error("request-password-reset-email: rate-limit subsystem unavailable", rateLimitMessage);
  }

  const { error } = await anonClient.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? undefined,
  });

  if (!error) {
    return json(200, { ok: true, code: "RESET_REQUEST_ACCEPTED", cooldownSec: FORGOT_PASSWORD_COOLDOWN_SECONDS }, corsHeaders);
  }

  if (isRateLimitedProviderError(error.message)) {
    return json(429, { ok: false, code: "RATE_LIMITED", retryAfterSec: FORGOT_PASSWORD_COOLDOWN_SECONDS }, corsHeaders);
  }

  const operationalFailure = {
    ok: false,
    code: "RESET_REQUEST_FAILED",
    reason: "provider_or_transport_error",
  };
  console.error("request-password-reset-email: provider reset failed", error.message);
  return json(200, operationalFailure, corsHeaders);
});
