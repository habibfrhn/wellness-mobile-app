import { createClient } from "supabase";
import { enforceRateLimit } from "../_shared/rateLimit.ts";

type NightSessionMode = "calm_mind" | "release_accept";

type RecordNightSessionBody = {
  date_key: string;
  mode: NightSessionMode;
  stress_before: number;
  stress_after: number;
};

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_AUTHORIZATION"
  | "INVALID_SESSION"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "RATE_LIMITED"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMIT_FAILED"
  | "UPSERT_FAILED"
  | "STREAK_UPDATE_FAILED";

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const RECORD_NIGHT_SESSION_RATE_LIMIT_RULE = {
  action: "record_night_session",
  windowSeconds: 600,
  limit: 6,
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function error(status: number, message: string, code: ErrorCode) {
  return json(status, { ok: false, error: message, code });
}

function isIntegerWithinStressRange(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

function isRecordNightSessionBody(payload: unknown): payload is RecordNightSessionBody {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const allowedKeys = ["date_key", "mode", "stress_before", "stress_after"];
  const payloadKeys = Object.keys(payload as Record<string, unknown>);
  if (payloadKeys.length !== allowedKeys.length || payloadKeys.some((key) => !allowedKeys.includes(key))) {
    return false;
  }

  const body = payload as Partial<RecordNightSessionBody>;
  if (!DATE_KEY_REGEX.test(body.date_key ?? "")) {
    return false;
  }

  if (body.mode !== "calm_mind" && body.mode !== "release_accept") {
    return false;
  }

  if (!isIntegerWithinStressRange(body.stress_before) || !isIntegerWithinStressRange(body.stress_after)) {
    return false;
  }

  return true;
}

function getAuthorizationToken(req: Request): string | null {
  const authorization = req.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}


Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return error(405, "Method not allowed", "METHOD_NOT_ALLOWED");
  }

  const token = getAuthorizationToken(req);
  if (!token) {
    return error(401, "Missing Authorization bearer token", "MISSING_AUTHORIZATION");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("record-night-session: missing environment variables");
    return error(500, "Server misconfiguration", "SERVER_MISCONFIGURATION");
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return error(400, "Invalid JSON body", "INVALID_JSON");
  }

  if (!isRecordNightSessionBody(payload)) {
    return error(400, "Invalid request payload", "INVALID_PAYLOAD");
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user?.id) {
    return error(401, "Invalid user session", "INVALID_SESSION");
  }

  const userId = userData.user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  try {
    const rateLimitDecision = await enforceRateLimit(adminClient, `user:${userId}`, RECORD_NIGHT_SESSION_RATE_LIMIT_RULE);
    if (!rateLimitDecision.allowed) {
      return json(429, {
        ok: false,
        error: "Too many requests",
        code: "RATE_LIMITED",
        retryAfterSec: rateLimitDecision.retryAfterSeconds,
      });
    }
  } catch (rateLimitError) {
    console.error("record-night-session: rate limit increment failed", rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError));
    return error(500, "Failed to process rate limit", "RATE_LIMIT_FAILED");
  }

  const { error: upsertError } = await adminClient.from("night_sessions").upsert(
    {
      user_id: userId,
      date_key: payload.date_key,
      mode: payload.mode,
      stress_before: payload.stress_before,
      stress_after: payload.stress_after,
      completed_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,date_key",
      ignoreDuplicates: false,
    }
  );

  if (upsertError) {
    console.error("record-night-session: upsert failed", upsertError.message);
    return error(500, "Failed to record night session", "UPSERT_FAILED");
  }

  const { data: streakData, error: streakError } = await userClient.rpc(
    "record_night_streak_completion",
    {
      p_completion_date: payload.date_key,
    }
  );

  if (streakError) {
    console.error("record-night-session: streak update failed", streakError.message);
    return error(500, "Failed to update streak", "STREAK_UPDATE_FAILED");
  }

  return json(200, { ok: true, streak: streakData ?? null });
});
