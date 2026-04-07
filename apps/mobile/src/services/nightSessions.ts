import { getNightDateKey } from "./nightStreak";
import { supabase } from "./supabase";

export type NightSessionMode = "calm_mind" | "release_accept";

type SaveNightSessionInput = {
  mode: NightSessionMode;
  stressBefore: number;
  stressAfter: number;
  completedAt?: Date;
};

type RecordNightSessionPayload = {
  date_key: string;
  mode: NightSessionMode;
  stress_before: number;
  stress_after: number;
};

export async function recordNightSession(payload: RecordNightSessionPayload): Promise<boolean> {
  const maxAttempts = 2;

  function isRetryableInvokeError(error: unknown) {
    if (!error || typeof error !== "object") {
      return false;
    }

    const maybeError = error as { context?: { status?: number }; message?: string };
    const status = maybeError.context?.status;
    if (typeof status === "number") {
      return status >= 500;
    }

    const normalized = (maybeError.message ?? "").toLowerCase();
    return normalized.includes("network") || normalized.includes("timeout") || normalized.includes("fetch");
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) {
      return false;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const { error } = await supabase.functions.invoke<{ ok: boolean }>("record-night-session", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
      });

      if (!error) {
        return true;
      }

      const shouldRetry = attempt < maxAttempts && isRetryableInvokeError(error);
      if (!shouldRetry) {
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Persist one completed night session row to Supabase.
 *
 * This helper is intentionally resilient:
 * - it never throws (returns `false` on failure)
 * - offline/network/table issues are silently handled by returning `false`
 */
export async function saveNightSessionCompletion({
  mode,
  stressBefore,
  stressAfter,
  completedAt = new Date(),
}: SaveNightSessionInput): Promise<boolean> {
  return recordNightSession({
    date_key: getNightDateKey(completedAt),
    mode,
    stress_before: stressBefore,
    stress_after: stressAfter,
  });
}
