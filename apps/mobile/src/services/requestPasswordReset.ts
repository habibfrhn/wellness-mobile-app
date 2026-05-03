import { AUTH_RESET, supabase } from "./supabase";
import { AUTH_EMAIL_COOLDOWN_SECONDS } from "./authEmailRateLimits";
import { isRateLimitedAuthError } from "./authSecurity";

export type PasswordResetResult =
  | { ok: true; cooldownSec: number }
  | { ok: false; code: "RATE_LIMITED"; retryAfterSec: number }
  | { ok: false; code: "RESET_REQUEST_FAILED" | "UNEXPECTED_ERROR" };

type PasswordResetResponse = {
  ok?: boolean;
  code?: string;
  cooldownSec?: number;
  retryAfterSec?: number;
};

async function extractFunctionErrorPayload(error: unknown): Promise<PasswordResetResponse | null> {
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

    return payload as PasswordResetResponse;
  } catch {
    return null;
  }
}

async function fallbackDirectReset(email: string): Promise<PasswordResetResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: AUTH_RESET,
  });

  if (!error) {
    return { ok: true, cooldownSec: AUTH_EMAIL_COOLDOWN_SECONDS };
  }

  if (isRateLimitedAuthError(error)) {
    return { ok: false, code: "RATE_LIMITED", retryAfterSec: AUTH_EMAIL_COOLDOWN_SECONDS };
  }

  const normalizedMessage = (error.message ?? "").toLowerCase();
  if (
    normalizedMessage.includes("smtp") ||
    normalizedMessage.includes("email provider") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("timeout")
  ) {
    return { ok: false, code: "RESET_REQUEST_FAILED" };
  }

  // Preserve privacy: unknown provider responses should not imply account existence.
  return { ok: true, cooldownSec: AUTH_EMAIL_COOLDOWN_SECONDS };
}

export async function requestPasswordResetEmail(email: string): Promise<PasswordResetResult> {
  const { data, error } = await supabase.functions.invoke<PasswordResetResponse>("request-password-reset-email", {
    body: { email, redirectTo: AUTH_RESET },
  });

  if (!error) {
    if (data?.ok === true) {
      return {
        ok: true,
        cooldownSec: typeof data.cooldownSec === "number" ? data.cooldownSec : AUTH_EMAIL_COOLDOWN_SECONDS,
      };
    }

    if (data?.code === "RATE_LIMITED") {
      return {
        ok: false,
        code: "RATE_LIMITED",
        retryAfterSec: typeof data.retryAfterSec === "number" ? data.retryAfterSec : AUTH_EMAIL_COOLDOWN_SECONDS,
      };
    }

    if (data?.code === "RESET_REQUEST_FAILED") {
      return { ok: false, code: "RESET_REQUEST_FAILED" };
    }

    return { ok: false, code: "UNEXPECTED_ERROR" };
  }

  const errorPayload = await extractFunctionErrorPayload(error);
  if (errorPayload?.code === "RATE_LIMITED") {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSec: typeof errorPayload.retryAfterSec === "number" ? errorPayload.retryAfterSec : AUTH_EMAIL_COOLDOWN_SECONDS,
    };
  }

  return fallbackDirectReset(email);
}
