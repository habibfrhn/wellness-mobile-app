import { createClient } from "supabase";

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Since verify_jwt = false, we must authenticate manually.
  const token = req.headers.get("x-user-jwt") ?? "";
  if (!token) return json(401, { error: "Missing user token" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "Missing Supabase environment variables" });
  }

  // Validate user by calling Auth using their JWT
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json(401, { error: "Invalid user session" });
  }

  // Delete user via admin
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: delErr } = await adminClient.auth.admin.deleteUser(userData.user.id);

  if (delErr) return json(500, { error: delErr.message });

  return json(200, { ok: true });
});
