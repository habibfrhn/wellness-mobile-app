import { AUTH_CALLBACK, hasValidAuthRedirects, supabase } from "./supabase";
import { logAuthDebugEvent } from "./authDebug";
import { AUTH_EMAIL_COOLDOWN_SECONDS } from "./authEmailRateLimits";

export type ResendVerificationResult =
  | { ok: true; cooldownSec: number }
  | { ok: false; code: "RATE_LIMITED"; retryAfterSec: number }
  | { ok: false; code: "LINK_STILL_VALID"; retryAfterSec: number }
  | { ok: false; code: "ALREADY_VERIFIED" }
  | { ok: false; code: "UNAVAILABLE" }
  | { ok: false; code: "MISCONFIGURED" }
  | { ok: false; code: "ERROR" };



function safeEmailLabel(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "invalid-email";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

type ResendVerificationResponse = {
  ok?: boolean;
  code?: string;
  cooldownSec?: number;
  retryAfterSec?: number;
};

async function extractFunctionErrorPayload(error: unknown): Promise<ResendVerificationResponse | null> {
  if (!error || typeof error !== "object" || !("context" in error)) {
    return null;
  }

  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== "object" || !("json" in context)) {
    return null;
  }

  const json = (context as { json?: () => Promise<unknown> }).json;
  if (typeof json !== "function") {
    return null;
  }

  try {
    const payload = await json();
    if (!payload || typeof payload !== "object") {
      return null;
    }

    return payload as ResendVerificationResponse;
  } catch {
    return null;
  }
}

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
  if (!hasValidAuthRedirects) {
    return { ok: false, code: "MISCONFIGURED" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  logAuthDebugEvent("info", "verify_resend_request_start", { email: safeEmailLabel(normalizedEmail) });

  const { data, error } = await supabase.functions.invoke<ResendVerificationResponse>("resend-verification-email", {
    body: {
      email: normalizedEmail,
      redirectTo: AUTH_CALLBACK,
    },
  });

  if (!error) {
    logAuthDebugEvent("info", "verify_resend_response_success", { cooldownSec: data?.cooldownSec ?? 60 });
    return {
      ok: true,
      cooldownSec: typeof data?.cooldownSec === "number" ? data.cooldownSec : AUTH_EMAIL_COOLDOWN_SECONDS,
    };
  }

  const errorPayload = await extractFunctionErrorPayload(error);
  logAuthDebugEvent("warn", "verify_resend_response_error", { code: errorPayload?.code ?? "UNKNOWN" });
  if (errorPayload?.code === "RATE_LIMITED") {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSec: typeof errorPayload.retryAfterSec === "number" ? errorPayload.retryAfterSec : AUTH_EMAIL_COOLDOWN_SECONDS,
    };
  }

  if (errorPayload?.code === "LINK_STILL_VALID") {
    return {
      ok: false,
      code: "LINK_STILL_VALID",
      retryAfterSec: typeof errorPayload.retryAfterSec === "number" ? errorPayload.retryAfterSec : 3600,
    };
  }

  if (errorPayload?.code === "ALREADY_VERIFIED") {
    return { ok: false, code: "ALREADY_VERIFIED" };
  }

  if (errorPayload?.code === "RATE_LIMIT_FAILED") {
    return { ok: false, code: "UNAVAILABLE" };
  }

  return { ok: false, code: "ERROR" };
}
