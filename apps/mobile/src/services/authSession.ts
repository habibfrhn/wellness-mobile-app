import { supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";

type SignOutScope = "global" | "local" | "others";
type AuthSession = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

let signOutInFlight: Promise<{ error: Error | null }> | null = null;

function normalizeAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "";
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message.toLowerCase() : "";
}

function isSessionMissingError(error: unknown) {
  const normalized = normalizeAuthErrorMessage(error);
  return (
    normalized.includes("auth session missing") ||
    normalized.includes("session_not_found") ||
    normalized.includes("session missing")
  );
}

function shouldRetryGlobalSignOut(error: unknown) {
  const normalized = normalizeAuthErrorMessage(error);
  return (
    normalized.includes("jwt") ||
    normalized.includes("token") ||
    normalized.includes("expired") ||
    normalized.includes("invalid")
  );
}

async function clearLocalSession() {
  const localResult = await supabase.auth.signOut({ scope: "local" });
  return localResult.error ?? null;
}

async function tryGlobalSignOut(scope: SignOutScope) {
  const result = await supabase.auth.signOut({ scope });
  return result.error ?? null;
}

export async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    if (error) {
      await clearLocalSession();
    }
    return { session: null as AuthSession, recovered: false };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = data.session.expires_at ?? nowSeconds;
  const shouldRefresh = expiresAt <= nowSeconds + 60;

  if (!shouldRefresh) {
    return { session: data.session, recovered: false };
  }

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshedData.session) {
    await clearLocalSession();
    return { session: null as AuthSession, recovered: false };
  }

  return { session: refreshedData.session, recovered: true };
}

export async function signOutToLogin(scope: SignOutScope = "global") {
  if (signOutInFlight) {
    return signOutInFlight;
  }

  signOutInFlight = (async () => {
    await setNextAuthRoute("Login");

    let finalError: Error | null = null;

    if (scope !== "local") {
      let globalError = await tryGlobalSignOut(scope);

      if (globalError && shouldRetryGlobalSignOut(globalError)) {
        await supabase.auth.refreshSession();
        globalError = await tryGlobalSignOut(scope);
      }

      if (globalError && !isSessionMissingError(globalError)) {
        finalError = globalError;
      }
    }

    const localError = await clearLocalSession();
    if (!finalError && localError && !isSessionMissingError(localError)) {
      finalError = localError;
    }

    return { error: finalError };
  })();

  try {
    return await signOutInFlight;
  } finally {
    signOutInFlight = null;
  }
}
