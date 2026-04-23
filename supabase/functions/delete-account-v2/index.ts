import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_USER_TOKEN"
  | "SERVER_MISCONFIGURATION"
  | "INVALID_SESSION"
  | "RATE_LIMITED"
  | "RATE_LIMIT_UNAVAILABLE"
  | "DELETE_FAILED";

const ACTION_NAME = "delete_user_account";
const MAX_REQUESTS_PER_HOUR = 3;
const REQUIRED_WEB_ORIGINS = ["https://www.lumepo.com", "https://lumepo.com"];
const LOCAL_DEV_ORIGINS = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
  "http://127.0.0.1:19006",
];
const VERCEL_PREVIEW_ORIGIN_REGEX = /^https:\/\/wellness-mobile(?:-app)?(?:-[a-z0-9-]+)?\.vercel\.app$/i;

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
  const allowedOrigins = Array.from(
    new Set([...configuredAllowedOrigins, ...REQUIRED_WEB_ORIGINS, ...LOCAL_DEV_ORIGINS])
  );

  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  if (VERCEL_PREVIEW_ORIGIN_REGEX.test(requestOrigin)) {
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

function getBearerToken(req: Request) {
  const authorization = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7);
}


function decodeJwtPayload(token: string) {
  try {
    const [, payload = ""] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const base64 = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload) as { sub?: string; exp?: number; aud?: string; role?: string };
  } catch {
    return null;
  }
}

function getHourBucket() {
  const date = new Date();
  date.setUTCMinutes(0, 0, 0);
  return `1h:${date.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

async function applyRateLimit(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action: ACTION_NAME,
    p_bucket: getHourBucket(),
  });

  if (error) {
    console.error("delete-account-v2: rate-limit rpc failed", error.message);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (typeof data === "number" && data > MAX_REQUESTS_PER_HOUR) {
    throw new Error("RATE_LIMITED");
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.headers.get("origin") && !corsHeaders["Access-Control-Allow-Origin"]) {
    console.warn("delete-account-v2: blocked origin", req.headers.get("origin"));
    return fail(403, "Origin not allowed", "METHOD_NOT_ALLOWED", corsHeaders);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return fail(405, "Method not allowed", "METHOD_NOT_ALLOWED", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("delete-account-v2: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return fail(500, "Server misconfiguration", "SERVER_MISCONFIGURATION", corsHeaders);
  }

  const userJwt = getBearerToken(req);
  if (!userJwt) {
    console.error("delete-account-v2: missing bearer token");
    return fail(401, "Missing user token", "MISSING_USER_TOKEN", corsHeaders);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const jwtPayload = decodeJwtPayload(userJwt);
  const { data: userData, error: userError } = await adminClient.auth.getUser(userJwt);
  const user = userData?.user;
  if (userError || !user) {
    const nowEpoch = Math.floor(Date.now() / 1000);
    const expiryDeltaSec = typeof jwtPayload?.exp === "number" ? jwtPayload.exp - nowEpoch : null;
    console.error("delete-account-v2: invalid user session", {
      error: userError?.message ?? "missing-user",
      tokenSub: jwtPayload?.sub ?? null,
      tokenAud: jwtPayload?.aud ?? null,
      tokenRole: jwtPayload?.role ?? null,
      tokenExpiresInSec: expiryDeltaSec,
    });
    return fail(401, "Invalid user session", "INVALID_SESSION", corsHeaders);
  }

  try {
    await applyRateLimit(adminClient, user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return fail(429, "Too many requests", "RATE_LIMITED", corsHeaders);
    }

    const rateLimitMessage = error instanceof Error ? error.message : String(error);
    console.error("delete-account-v2: rate-limit check unavailable", rateLimitMessage);
    return fail(503, "Service temporarily unavailable", "RATE_LIMIT_UNAVAILABLE", corsHeaders);
  }

  // Force hard-delete account (explicit false) so it is removed from auth.users dashboard and not anonymized.
  const { error: hardDeleteError } = await adminClient.auth.admin.deleteUser(user.id, false);
  if (hardDeleteError) {
    console.error("delete-account-v2: hard delete failed", hardDeleteError.message);
    return fail(500, "Failed to delete account", "DELETE_FAILED", corsHeaders);
  }

  return json(200, { ok: true }, corsHeaders);
});
