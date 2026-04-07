import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_USER_TOKEN"
  | "SERVER_MISCONFIGURATION"
  | "INVALID_SESSION"
  | "RATE_LIMIT_FAILED"
  | "RATE_LIMITED"
  | "DELETE_FAILED";

type ServeDeleteAccountOptions = {
  functionName: string;
  acceptBodyJwt: boolean;
};

const ACTION_NAME = "delete_user_account";
const MAX_REQUESTS_PER_HOUR = 3;

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

async function getUserJwt(req: Request, acceptBodyJwt: boolean) {
  if (acceptBodyJwt) {
    try {
      const payload = (await req.clone().json()) as { userJwt?: string };
      const bodyToken = typeof payload?.userJwt === "string" ? payload.userJwt.trim() : "";
      if (bodyToken.length > 0) {
        return { token: bodyToken, source: "body" as const };
      }
    } catch {
      // ignore invalid/empty JSON payloads and continue to header fallback
    }
  }

  const authorization = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return { token: "", source: "none" as const };
  }

  return { token: authorization.slice(7), source: "authorization" as const };
}

function maskToken(token: string) {
  if (token.length <= 14) {
    return `${token.slice(0, 3)}...`;
  }

  return `${token.slice(0, 7)}...${token.slice(-5)}`;
}

function getHourBucket() {
  const date = new Date();
  date.setUTCMinutes(0, 0, 0);
  return `1h:${date.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

function logRateLimitEvent(payload: Record<string, unknown>) {
  console.warn(JSON.stringify({ event: "rate_limit_429", surface: "delete-account", ...payload }));
}

async function applyRateLimit(adminClient: ReturnType<typeof createClient>, userId: string, bucket: string) {
  const { data, error } = await adminClient.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action: ACTION_NAME,
    p_bucket: bucket,
  });

  if (error || typeof data !== "number") {
    console.error("delete-account: rate-limit rpc failed", {
      message: error?.message ?? "unknown",
      userId,
      bucket,
      action: ACTION_NAME,
    });
    throw new Error("RATE_LIMIT_FAILED");
  }

  if (data > MAX_REQUESTS_PER_HOUR) {
    logRateLimitEvent({ user_id: userId, action: ACTION_NAME, bucket, incremented_count: data, limit: MAX_REQUESTS_PER_HOUR });
    throw new Error("RATE_LIMITED");
  }
}

export function serveDeleteAccount(options: ServeDeleteAccountOptions) {
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`${options.functionName}: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
      return fail(500, "Server misconfiguration", "SERVER_MISCONFIGURATION", corsHeaders);
    }

    const userJwtResult = await getUserJwt(req, options.acceptBodyJwt);
    if (!userJwtResult.token) {
      console.error(`${options.functionName}: missing user token from request`);
      return fail(401, "Missing user token", "MISSING_USER_TOKEN", corsHeaders);
    }

    console.log(`${options.functionName}: user jwt parsed`, {
      tokenPreview: maskToken(userJwtResult.token),
      source: userJwtResult.source,
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await adminClient.auth.getUser(userJwtResult.token);
    const user = userData?.user;

    if (userError || !user) {
      console.error(`${options.functionName}: invalid user session`, userError?.message ?? "missing-user");
      return fail(401, "Invalid user session", "INVALID_SESSION", corsHeaders);
    }

    const bucket = getHourBucket();
    try {
      await applyRateLimit(adminClient, user.id, bucket);
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMITED") {
        return fail(429, "Too many requests", "RATE_LIMITED", corsHeaders);
      }

      return fail(500, "Failed to process rate limit", "RATE_LIMIT_FAILED", corsHeaders);
    }

    const { error: hardDeleteError } = await adminClient.auth.admin.deleteUser(user.id, false);
    if (hardDeleteError) {
      console.error(`${options.functionName}: hard delete failed`, {
        hardDeleteError: hardDeleteError.message,
      });
      return fail(500, "Failed to delete account", "DELETE_FAILED", corsHeaders);
    }

    console.log(`${options.functionName}: account deletion succeeded`, { userId: user.id });
    return json(200, { ok: true }, corsHeaders);
  });
}
