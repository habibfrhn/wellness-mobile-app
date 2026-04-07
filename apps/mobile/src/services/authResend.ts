import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUTH_CALLBACK, supabase } from "./supabase";

export type ResendVerificationResult =
  | { ok: true; cooldownSec: number }
  | { ok: false; code: "RATE_LIMITED"; retryAfterSec: number }
  | { ok: false; code: "LINK_STILL_VALID"; retryAfterSec: number }
  | { ok: false; code: "UNAVAILABLE" }
  | { ok: false; code: "ERROR" };


const LINK_VALID_WINDOW_SECONDS = 3600;
const LINK_SENT_AT_KEY_PREFIX = "auth:verify_link_sent_at:";

function getLinkSentAtKey(email: string) {
  return `${LINK_SENT_AT_KEY_PREFIX}${email.trim().toLowerCase()}`;
}

async function getLocalLinkValidityRemainingSec(email: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(getLinkSentAtKey(email));
    const sentAtMs = Number(raw);
    if (!Number.isFinite(sentAtMs) || sentAtMs <= 0) {
      return 0;
    }

    const elapsedSec = Math.floor((Date.now() - sentAtMs) / 1000);
    const remaining = LINK_VALID_WINDOW_SECONDS - elapsedSec;
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

export async function markVerificationLinkSent(email: string) {
  try {
    await AsyncStorage.setItem(getLinkSentAtKey(email), String(Date.now()));
  } catch {
    // best effort only
  }
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
  const localValidityRemaining = await getLocalLinkValidityRemainingSec(email);
  if (localValidityRemaining > 0) {
    return { ok: false, code: "LINK_STILL_VALID", retryAfterSec: localValidityRemaining };
  }

  const { data, error } = await supabase.functions.invoke<ResendVerificationResponse>("resend-verification-email", {
    body: {
      email: email.trim().toLowerCase(),
      redirectTo: AUTH_CALLBACK,
    },
  });

  if (!error) {
    await markVerificationLinkSent(email);
    return {
      ok: true,
      cooldownSec: typeof data?.cooldownSec === "number" ? data.cooldownSec : 60,
    };
  }

  const errorPayload = await extractFunctionErrorPayload(error);
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
