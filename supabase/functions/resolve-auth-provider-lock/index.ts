import { createClient } from "npm:@supabase/supabase-js@2";

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMITED"
  | "LOOKUP_FAILED";

type RequestBody = {
  email?: string;
};

type AuthUserRow = {
  id: string;
  created_at?: string | null;
  encrypted_password?: string | null;
  is_sso_user?: boolean | null;
  raw_app_meta_data?: {
    provider?: unknown;
    providers?: unknown;
  } | null;
};

type AuthIdentityRow = {
  provider?: string | null;
  created_at?: string | null;
};

const REQUIRED_WEB_ORIGINS = ["https://www.lumepo.com", "https://lumepo.com"];
const LOCAL_DEV_ORIGINS = ["http://localhost:8081", "http://127.0.0.1:8081"];
const VERCEL_PREVIEW_ORIGIN_REGEX = /^https:\/\/wellness-mobile-[a-z0-9-]+\.vercel\.app$/i;

const ACTION_PROVIDER_LOCK_LOOKUP = "auth_provider_lock_lookup";
const LOOKUP_LIMIT_PER_MINUTE = 30;

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

function inferProviderFromUserRow(user: AuthUserRow) {
  const inferredProviders: string[] = [];

  if (user.encrypted_password) {
    inferredProviders.push("email");
  }

  if (user.is_sso_user) {
    inferredProviders.push("unknown");
  }

  return inferredProviders;
}

function resolveProviderLock(providers: string[], primaryProvider: string | null) {
  if (primaryProvider) {
    return primaryProvider;
  }

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
  // Fall back to a relaxed lock only when a primary provider cannot be inferred.
  return null;
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

function getMinuteBucket(date: Date) {
  return `60s:${Math.floor(date.getTime() / 60_000)}`;
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

  try {
    const now = new Date();
    const principalKey = await sha256(`${getClientIp(req)}|${email}`);
    const count = await incrementRateLimit(adminClient, principalKey, ACTION_PROVIDER_LOCK_LOOKUP, getMinuteBucket(now));
    if (count > LOOKUP_LIMIT_PER_MINUTE) {
      return fail(429, "Rate limited", "RATE_LIMITED", corsHeaders);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("resolve-auth-provider-lock: rate-limit subsystem unavailable", message);
  }

  const { data: users, error: usersError } = await adminClient
    .schema("auth")
    .from("users")
    .select("id, created_at, encrypted_password, is_sso_user, raw_app_meta_data")
    .ilike("email", email)
    .order("created_at", { ascending: true })
    .limit(10);

  if (usersError) {
    console.error("resolve-auth-provider-lock: user lookup failed", usersError.message);
    return fail(500, "Provider lookup failed", "LOOKUP_FAILED", corsHeaders);
  }

  const normalizedUsers = (users ?? []) as AuthUserRow[];
  if (!normalizedUsers.length) {
    return json(200, { ok: true, exists: false, providers: [], primaryProvider: null, providerLock: null }, corsHeaders);
  }

  const userIds = normalizedUsers.map((user) => user.id);
  const { data: identities, error: identitiesError } = await adminClient
    .schema("auth")
    .from("identities")
    .select("provider, created_at")
    .in("user_id", userIds);

  if (identitiesError) {
    console.error("resolve-auth-provider-lock: identities lookup failed", identitiesError.message);
    return fail(500, "Provider lookup failed", "LOOKUP_FAILED", corsHeaders);
  }

  const normalizedIdentities = (identities ?? []) as AuthIdentityRow[];
  const identityProviders = normalizedIdentities
    .map((identity) => ({
      provider: normalizeProvider(identity.provider ?? ""),
      createdAt: identity.created_at ? Date.parse(identity.created_at) : Number.NaN,
    }))
    .filter((identity): identity is { provider: string; createdAt: number } => Boolean(identity.provider))
    .sort((left, right) => {
      if (Number.isNaN(left.createdAt) && Number.isNaN(right.createdAt)) {
        return 0;
      }

      if (Number.isNaN(left.createdAt)) {
        return 1;
      }

      if (Number.isNaN(right.createdAt)) {
        return -1;
      }

      return left.createdAt - right.createdAt;
    })
    .map((identity) => identity.provider);

  const metaAndInferredProviders = normalizedUsers.flatMap((user) => [
    ...getMetaProviders(user),
    ...inferProviderFromUserRow(user),
  ]);

  const providers = Array.from(new Set([...identityProviders, ...metaAndInferredProviders]));
  const primaryProvider = identityProviders[0] ?? metaAndInferredProviders[0] ?? null;

  return json(
    200,
    {
      ok: true,
      exists: true,
      providers,
      primaryProvider,
      providerLock: resolveProviderLock(providers, primaryProvider),
    },
    corsHeaders
  );
});
