import { createClient } from "supabase";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_USER_TOKEN"
  | "SERVER_MISCONFIGURATION"
  | "INVALID_SESSION"
  | "RATE_LIMIT_FAILED"
  | "RATE_LIMITED"
  | "DELETE_FAILED";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTION_NAME = "delete_user_account";
const MAX_REQUESTS_PER_HOUR = 3;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function error(status: number, message: string, code: ErrorCode) {
  return json(status, { ok: false, error: message, code });
}

function getAuthorizationToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7);
  }

  return "";
}

function getHourBucket(date: Date): string {
  const bucketDate = new Date(date);
  bucketDate.setUTCMinutes(0, 0, 0);
  return `1h:${bucketDate.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error(405, "Method not allowed", "METHOD_NOT_ALLOWED");

  const token = getAuthorizationToken(req);
  if (!token) return error(401, "Missing user token", "MISSING_USER_TOKEN");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("delete-user-account: missing environment variables");
    return error(500, "Server misconfiguration", "SERVER_MISCONFIGURATION");
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    console.error("delete-user-account: invalid user session", userErr);
    return error(401, "Invalid user session", "INVALID_SESSION");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const rateLimitBucket = getHourBucket(new Date());
  const { data: incrementedCount, error: rateLimitError } = await adminClient.rpc(
    "increment_rate_limit",
    {
      p_user_id: userData.user.id,
      p_action: ACTION_NAME,
      p_bucket: rateLimitBucket,
    }
  );

  if (rateLimitError || typeof incrementedCount !== "number") {
    console.error("delete-user-account: rate limit increment failed", rateLimitError);
    return error(500, "Failed to process rate limit", "RATE_LIMIT_FAILED");
  }

  if (incrementedCount > MAX_REQUESTS_PER_HOUR) {
    return error(429, "Too many requests", "RATE_LIMITED");
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);

  if (deleteError) {
    console.error("delete-user-account: failed to delete user", deleteError);
    return error(500, "Failed to delete account", "DELETE_FAILED");
  }

  return json(200, { ok: true });
});
