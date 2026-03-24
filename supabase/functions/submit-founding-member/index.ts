import { createClient } from "supabase";

type SubmissionPayload = {
  name: string;
  email: string;
  sleep_issue: string;
  sleep_frequency: "hampir_setiap_malam" | "beberapa_kali_seminggu" | "kadang_kadang";
  joining_reason: string;
  feedback_willingness: "ya" | "mungkin" | "tidak";
  interview_willingness: "ya" | "mungkin" | "tidak";
  payment_willingness: "ya" | "mungkin" | "tidak";
  preferred_monthly_price: "29000" | "49000" | "79000" | "99000_plus";
  consent_to_contact: boolean;
};

type ErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "MISSING_AUTHORIZATION"
  | "INVALID_SESSION"
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "SERVER_MISCONFIGURATION"
  | "RATE_LIMIT_FAILED"
  | "RATE_LIMITED"
  | "SUBMISSION_FAILED";

const ACTION_NAME = "submit_founding_member";
const MAX_SUBMISSIONS_PER_DAY = 3;

const ALLOWED_SLEEP_FREQUENCY = new Set(["hampir_setiap_malam", "beberapa_kali_seminggu", "kadang_kadang"]);
const ALLOWED_SUPPORT = new Set(["ya", "mungkin", "tidak"]);
const ALLOWED_PRICING = new Set(["29000", "49000", "79000", "99000_plus"]);

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
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

function getDayBucket(date: Date): string {
  const bucketDate = new Date(date);
  bucketDate.setUTCHours(0, 0, 0, 0);
  return `1d:${bucketDate.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPayload(payload: unknown): payload is SubmissionPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const body = payload as Partial<SubmissionPayload>;

  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80) {
    return false;
  }

  if (typeof body.email !== "string" || body.email.trim().length > 120 || !isValidEmail(body.email.trim())) {
    return false;
  }

  if (typeof body.sleep_issue !== "string" || body.sleep_issue.trim().length < 8 || body.sleep_issue.trim().length > 1200) {
    return false;
  }

  if (typeof body.joining_reason !== "string" || body.joining_reason.trim().length < 8 || body.joining_reason.trim().length > 1200) {
    return false;
  }

  if (!ALLOWED_SLEEP_FREQUENCY.has(body.sleep_frequency ?? "")) {
    return false;
  }

  if (!ALLOWED_SUPPORT.has(body.feedback_willingness ?? "")) {
    return false;
  }

  if (!ALLOWED_SUPPORT.has(body.interview_willingness ?? "")) {
    return false;
  }

  if (!ALLOWED_SUPPORT.has(body.payment_willingness ?? "")) {
    return false;
  }

  if (!ALLOWED_PRICING.has(body.preferred_monthly_price ?? "")) {
    return false;
  }

  if (typeof body.consent_to_contact !== "boolean") {
    return false;
  }

  return true;
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
    console.error("submit-founding-member: missing environment variables");
    return error(500, "Server misconfiguration", "SERVER_MISCONFIGURATION");
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return error(400, "Invalid JSON body", "INVALID_JSON");
  }

  if (!isValidPayload(payload)) {
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

  const { data: incrementedCount, error: rateLimitError } = await adminClient.rpc(
    "increment_rate_limit",
    {
      p_user_id: userId,
      p_action: ACTION_NAME,
      p_bucket: getDayBucket(new Date()),
    },
  );

  if (rateLimitError || typeof incrementedCount !== "number") {
    console.error("submit-founding-member: rate limit increment failed", rateLimitError);
    return error(500, "Failed to process rate limit", "RATE_LIMIT_FAILED");
  }

  if (incrementedCount > MAX_SUBMISSIONS_PER_DAY) {
    return error(429, "Too many requests", "RATE_LIMITED");
  }

  const { error: insertError } = await adminClient.from("founding_member_submissions").insert({
    user_id: userId,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    sleep_issue: payload.sleep_issue.trim(),
    sleep_frequency: payload.sleep_frequency,
    joining_reason: payload.joining_reason.trim(),
    feedback_willingness: payload.feedback_willingness,
    interview_willingness: payload.interview_willingness,
    payment_willingness: payload.payment_willingness,
    preferred_monthly_price: payload.preferred_monthly_price,
    consent_to_contact: payload.consent_to_contact,
  });

  if (insertError) {
    console.error("submit-founding-member: insert failed", insertError);
    return error(500, "Failed to save submission", "SUBMISSION_FAILED");
  }

  return json(200, { ok: true });
});
