import { AUTH_CALLBACK, supabase } from "./supabase";

export type ResendVerificationResult =
  | { ok: true; cooldownSec: number }
  | { ok: false; code: "RATE_LIMITED"; retryAfterSec: number }
  | { ok: false; code: "LINK_STILL_VALID"; retryAfterSec: number }
  | { ok: false; code: "UNAVAILABLE" }
  | { ok: false; code: "ERROR" };


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
  if (__DEV__) {
    console.log("authResend: invoke resend-verification-email", { emailPreview: `${email.slice(0, 3)}***` });
  }
  const { data, error } = await supabase.functions.invoke<ResendVerificationResponse>("resend-verification-email", {
    body: {
      email: email.trim().toLowerCase(),
      redirectTo: AUTH_CALLBACK,
    },
  });

  if (!error) {
    if (__DEV__) {
      console.log("authResend: resend-verification-email success", data);
    }
    return {
      ok: true,
      cooldownSec: typeof data?.cooldownSec === "number" ? data.cooldownSec : 60,
    };
  }

  const errorPayload = await extractFunctionErrorPayload(error);
  if (__DEV__) {
    console.warn("authResend: resend-verification-email error", { message: error?.message, payload: errorPayload });
  }
  if (errorPayload?.code === "RATE_LIMITED") {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSec: typeof errorPayload.retryAfterSec === "number" ? errorPayload.retryAfterSec : 60,
    };
  }

  if (errorPayload?.code === "LINK_STILL_VALID") {
    return {
      ok: false,
      code: "LINK_STILL_VALID",
      retryAfterSec: typeof errorPayload.retryAfterSec === "number" ? errorPayload.retryAfterSec : 3600,
    };
  }

  if (errorPayload?.code === "RATE_LIMIT_FAILED") {
    return { ok: false, code: "UNAVAILABLE" };
  }

  return { ok: false, code: "ERROR" };
}
