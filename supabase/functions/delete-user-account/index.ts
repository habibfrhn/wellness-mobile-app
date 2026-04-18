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
  const allowedOrigins = Array.from(new Set([...configuredAllowedOrigins, ...REQUIRED_WEB_ORIGINS]));

  if (configuredAllowedOrigins.length === 0) {
    return "*";
  }

  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null;
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

async function applyRateLimit(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient.rpc("increment_rate_limit", {
    p_user_id: userId,
    p_action: ACTION_NAME,
    p_bucket: getHourBucket(),
  });

  if (error) {
    console.error("delete-user-account: rate-limit rpc failed", error.message);
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }

  if (typeof data === "number" && data > MAX_REQUESTS_PER_HOUR) {
    throw new Error("RATE_LIMITED");
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);
  console.log("delete-user-account: request received", {
    method: req.method,
    origin: req.headers.get("origin"),
    hasAuthorizationHeader: Boolean(req.headers.get("authorization") ?? req.headers.get("Authorization")),
    hasApiKeyHeader: Boolean(req.headers.get("apikey")),
  });

  if (req.headers.get("origin") && !corsHeaders["Access-Control-Allow-Origin"]) {
    return fail(403, "Origin not allowed", "METHOD_NOT_ALLOWED", corsHeaders);
  }

  if (req.method === "OPTIONS") {
    console.log("delete-user-account: OPTIONS preflight accepted");
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return fail(405, "Method not allowed", "METHOD_NOT_ALLOWED", corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("delete-user-account: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return fail(500, "Server misconfiguration", "SERVER_MISCONFIGURATION", corsHeaders);
  }

  const bearerToken = getBearerToken(req);
  if (!bearerToken) {
    console.error("delete-user-account: missing bearer token after header parse");
    return fail(401, "Missing user token", "MISSING_USER_TOKEN", corsHeaders);
  }

  console.log("delete-user-account: bearer token parsed", {
    tokenPreview: maskToken(bearerToken),
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await adminClient.auth.getUser(bearerToken);
  const user = userData?.user;
  if (userError || !user) {
    console.error("delete-user-account: invalid user session", userError?.message ?? "missing-user");
    return fail(401, "Invalid user session", "INVALID_SESSION", corsHeaders);
  }

  console.log("delete-user-account: session validated", {
    userId: user.id,
    email: user.email ?? null,
  });

  try {
    await applyRateLimit(adminClient, user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return fail(429, "Too many requests", "RATE_LIMITED", corsHeaders);
    }

    console.error("delete-user-account: rate-limit check unavailable", error);
    return fail(503, "Service temporarily unavailable", "RATE_LIMIT_UNAVAILABLE", corsHeaders);
  }

  // Soft-delete first: this works for both email/password and OAuth users,
  // and avoids FK-constraint failures on auth.users hard deletion.
  const { error: softDeleteError } = await adminClient.auth.admin.deleteUser(user.id, true);
  if (softDeleteError) {
    // Fall back to hard delete just in case soft delete is unavailable.
    const { error: hardDeleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (hardDeleteError) {
      console.error("delete-user-account: failed to delete user", {
        softDeleteError: softDeleteError.message,
        hardDeleteError: hardDeleteError.message,
      });
      return fail(500, "Failed to delete account", "DELETE_FAILED", corsHeaders);
    }
  }

  console.log("delete-user-account: account deletion succeeded", { userId: user.id });
  return json(200, { ok: true }, corsHeaders);
});
