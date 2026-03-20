import { createClient } from "supabase";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_USER_TOKEN"
  | "SERVER_MISCONFIGURATION"
  | "INVALID_SESSION"
  | "DELETE_FAILED";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  return req.headers.get("x-user-jwt") ?? "";
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
    console.error("delete-account: missing environment variables");
    return error(500, "Server misconfiguration", "SERVER_MISCONFIGURATION");
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    console.error("delete-account: invalid user session", userErr);
    return error(401, "Invalid user session", "INVALID_SESSION");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: delErr } = await adminClient.auth.admin.deleteUser(userData.user.id);

  if (delErr) {
    console.error("delete-account: failed to delete user", delErr);
    return error(500, delErr.message || "Failed to delete account", "DELETE_FAILED");
  }

  return json(200, { ok: true });
});
