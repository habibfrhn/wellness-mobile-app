import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "SERVER_MISCONFIGURATION"
  | "LOOKUP_FAILED";

type RequestBody = {
  email?: string;
};

type AuthUserRow = {
  id: string;
  raw_app_meta_data?: {
    provider?: unknown;
    providers?: unknown;
  } | null;
};

type AuthIdentityRow = {
  provider?: string | null;
};

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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeProvider(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return normalized || null;
}

function getMetaProviders(user: AuthUserRow) {
  const providers = user.raw_app_meta_data?.providers;
  if (Array.isArray(providers)) {
    return providers
      .filter((value): value is string => typeof value === "string")
      .map(normalizeProvider)
      .filter((value): value is string => Boolean(value));
  }

  const singleProvider = user.raw_app_meta_data?.provider;
  if (typeof singleProvider === "string") {
    const normalized = normalizeProvider(singleProvider);
    return normalized ? [normalized] : [];
  }

  return [];
}

function resolveProviderLock(providers: string[]) {
  const uniqueProviders = Array.from(new Set(providers));
  if (uniqueProviders.length === 0) {
    return null;
  }

  if (uniqueProviders.includes("email") && uniqueProviders.length === 1) {
    return "email";
  }

  const oauthProviders = uniqueProviders.filter((provider) => provider !== "email");
  if (oauthProviders.length === 1) {
    return oauthProviders[0];
  }

  // Legacy accounts can already have linked multi-provider identities.
  // Keep them functional by not enforcing a strict lock in that case.
  return null;
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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return fail(500, "Server misconfiguration", "SERVER_MISCONFIGURATION", corsHeaders);
  }

  let payload: RequestBody;
  try {
    payload = (await req.json()) as RequestBody;
  } catch {
    return fail(400, "Invalid JSON body", "INVALID_JSON", corsHeaders);
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return fail(400, "Invalid request payload", "INVALID_PAYLOAD", corsHeaders);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: users, error: usersError } = await adminClient
    .schema("auth")
    .from("users")
    .select("id, raw_app_meta_data")
    .ilike("email", email)
    .limit(1);

  if (usersError) {
    console.error("resolve-auth-provider-lock: user lookup failed", usersError.message);
    return fail(500, "Provider lookup failed", "LOOKUP_FAILED", corsHeaders);
  }

  const user = (users ?? [])[0] as AuthUserRow | undefined;
  if (!user) {
    return json(200, { ok: true, exists: false, providers: [], primaryProvider: null, providerLock: null }, corsHeaders);
  }

  const { data: identities, error: identitiesError } = await adminClient
    .schema("auth")
    .from("identities")
    .select("provider")
    .eq("user_id", user.id);

  if (identitiesError) {
    console.error("resolve-auth-provider-lock: identities lookup failed", identitiesError.message);
    return fail(500, "Provider lookup failed", "LOOKUP_FAILED", corsHeaders);
  }

  const identityProviders = (identities ?? [])
    .map((identity) => normalizeProvider((identity as AuthIdentityRow).provider ?? ""))
    .filter((provider): provider is string => Boolean(provider));
  const providers = Array.from(new Set([...identityProviders, ...getMetaProviders(user)]));

  return json(
    200,
    {
      ok: true,
      exists: true,
      providers,
      primaryProvider: providers[0] ?? null,
      providerLock: resolveProviderLock(providers),
    },
    corsHeaders
  );
});
