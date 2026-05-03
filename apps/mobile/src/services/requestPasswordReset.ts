import { AUTH_RESET, supabase } from "./supabase";
import { AUTH_EMAIL_COOLDOWN_SECONDS } from "./authEmailRateLimits";

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

export async function requestPasswordResetEmail(email: string): Promise<PasswordResetResult> {
  const { data, error } = await supabase.functions.invoke<PasswordResetResponse>("request-password-reset-email", {
    body: { email, redirectTo: AUTH_RESET },
  });

  if (error) {
    return { ok: false, code: "UNEXPECTED_ERROR" };
  }

  if (data?.ok === true) {
    return { ok: true, cooldownSec: typeof data.cooldownSec === "number" ? data.cooldownSec : AUTH_EMAIL_COOLDOWN_SECONDS };
  }

  if (data?.code === "RATE_LIMITED") {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSec: typeof data.retryAfterSec === "number" ? data.retryAfterSec : AUTH_EMAIL_COOLDOWN_SECONDS,
    };
  }

  return { ok: false, code: "RESET_REQUEST_FAILED" };
}
