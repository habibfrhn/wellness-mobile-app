import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";
import { logLogoutEvent } from "./logoutDebug";

type SignOutScope = "global" | "local" | "others";
type AuthSession = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

type SignOutSource =
  | "home_settings_button"
  | "home_mobile_menu"
  | "profile_screen"
  | "admin_dashboard"
  | "password_reset"
  | "email_verification_guard"
  | "provider_lock_oauth_callback_missing_email"
  | "unknown";

let signOutInFlight: Promise<{ error: Error | null }> | null = null;

function toError(value: unknown, fallbackMessage: string) {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return new Error(value);
  }

  return new Error(fallbackMessage);
}

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

function getSupabaseStorageKey() {
  return (supabase.auth as unknown as { storageKey?: string }).storageKey ?? null;
}

function getWebStorageKeysToClear(storageKey: string | null) {
  const keys = new Set<string>();
  if (storageKey) {
    keys.add(storageKey);
    keys.add(`${storageKey}-code-verifier`);
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const candidate = window.localStorage.key(i);
      if (!candidate) {
        continue;
      }

      if (/^sb-[a-z0-9]+-auth-token$/i.test(candidate) || /^sb-[a-z0-9]+-auth-token-code-verifier$/i.test(candidate)) {
        keys.add(candidate);
      }
    }
  }

  return [...keys];
}

function clearWebAuthCookies() {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return 0;
  }

  const rawCookies = document.cookie ? document.cookie.split(";") : [];
  let removed = 0;

  rawCookies.forEach((rawCookie) => {
    const [rawName] = rawCookie.split("=");
    const name = rawName?.trim();
    if (!name) {
      return;
    }

    if (!name.toLowerCase().includes("sb-") && !name.toLowerCase().includes("supabase")) {
      return;
    }

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Lax`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=${window.location.hostname};SameSite=Lax`;
    removed += 1;
  });

  return removed;
}

async function clearPersistedSessionArtifacts() {
  const storageKey = getSupabaseStorageKey();

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const keys = getWebStorageKeysToClear(storageKey);
    keys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        logLogoutEvent("warn", "logout_storage_cleanup_localstorage_failed", {
          key,
          error: toError(error, "failed to remove localStorage key").message,
        });
      }

      try {
        window.sessionStorage.removeItem(key);
      } catch (error) {
        logLogoutEvent("warn", "logout_storage_cleanup_sessionstorage_failed", {
          key,
          error: toError(error, "failed to remove sessionStorage key").message,
        });
      }
    });

    const removedCookies = clearWebAuthCookies();

    logLogoutEvent("info", "logout_storage_cleanup_complete", {
      storageKey,
      removedLocalStorageKeys: keys,
      removedCookieCount: removedCookies,
    });
    return;
  }

  if (storageKey) {
    await AsyncStorage.removeItem(storageKey);
    await AsyncStorage.removeItem(`${storageKey}-code-verifier`);
  }

  logLogoutEvent("info", "logout_storage_cleanup_complete", {
    storageKey,
    removedLocalStorageKeys: storageKey ? [storageKey, `${storageKey}-code-verifier`] : [],
    removedCookieCount: 0,
  });
}

async function clearLocalSession() {
  logLogoutEvent("info", "logout_signout_local_start");
  let localResult: Awaited<ReturnType<typeof supabase.auth.signOut>>;
  try {
    localResult = await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    const resolvedError = toError(error, "Local sign out failed");
    logLogoutEvent("warn", "logout_signout_local_result", {
      ok: false,
      error: resolvedError.message,
    });
    return resolvedError;
  }

  logLogoutEvent(localResult.error ? "warn" : "info", "logout_signout_local_result", {
    ok: !localResult.error,
    error: localResult.error?.message ?? null,
  });
  return localResult.error ?? null;
}

async function tryGlobalSignOut(scope: SignOutScope) {
  logLogoutEvent("info", "logout_signout_remote_start", { scope });
  let result: Awaited<ReturnType<typeof supabase.auth.signOut>>;
  try {
    result = await supabase.auth.signOut({ scope });
  } catch (error) {
    const resolvedError = toError(error, "Remote sign out failed");
    logLogoutEvent("warn", "logout_signout_remote_result", {
      scope,
      ok: false,
      error: resolvedError.message,
    });
    return resolvedError;
  }

  logLogoutEvent(result.error ? "warn" : "info", "logout_signout_remote_result", {
    scope,
    ok: !result.error,
    error: result.error?.message ?? null,
  });
  return result.error ?? null;
}

async function logSessionSnapshot(event: string) {
  const { data, error } = await supabase.auth.getSession();
  logLogoutEvent(error ? "warn" : "info", event, {
    hasSession: Boolean(data.session),
    userId: data.session?.user.id ?? null,
    expiresAt: data.session?.expires_at ?? null,
    error: error?.message ?? null,
  });
}

export async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();

  logLogoutEvent(error ? "warn" : "info", "logout_restore_session_start", {
    hasSession: Boolean(data.session),
    userId: data.session?.user.id ?? null,
    error: error?.message ?? null,
  });

  if (error || !data.session) {
    if (error) {
      await clearLocalSession();
      await clearPersistedSessionArtifacts();
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
    await clearPersistedSessionArtifacts();
    return { session: null as AuthSession, recovered: false };
  }

  return { session: refreshedData.session, recovered: true };
}

export async function signOutToLogin(
  scope: SignOutScope = "global",
  options?: { source?: SignOutSource }
) {
  if (signOutInFlight) {
    logLogoutEvent("warn", "logout_signout_deduped", {
      source: options?.source ?? "unknown",
      scope,
    });
    return signOutInFlight;
  }

  signOutInFlight = (async () => {
    const source = options?.source ?? "unknown";

    logLogoutEvent("info", "logout_flow_start", {
      source,
      scope,
    });

    await logSessionSnapshot("logout_session_snapshot_before");

    try {
      await setNextAuthRoute("Login");
    } catch (error) {
      logLogoutEvent("warn", "logout_set_next_auth_route_failed", {
        error: toError(error, "Failed to persist auth start route").message,
      });
    }

    let finalError: Error | null = null;

    if (scope !== "local") {
      let globalError = await tryGlobalSignOut(scope);

      if (globalError && shouldRetryGlobalSignOut(globalError)) {
        logLogoutEvent("warn", "logout_signout_remote_retrying_after_refresh", {
          reason: globalError.message,
        });
        try {
          await supabase.auth.refreshSession();
          globalError = await tryGlobalSignOut(scope);
        } catch (error) {
          globalError = toError(error, "Failed to refresh session before retrying logout");
        }
      }

      if (globalError && !isSessionMissingError(globalError)) {
        finalError = globalError;
      }
    }

    const localError = await clearLocalSession();
    if (!finalError && localError && !isSessionMissingError(localError)) {
      finalError = localError;
    }

    await clearPersistedSessionArtifacts();
    await logSessionSnapshot("logout_session_snapshot_after");

    logLogoutEvent(finalError ? "error" : "info", "logout_flow_complete", {
      source,
      scope,
      ok: !finalError,
      error: finalError?.message ?? null,
    });

    return { error: finalError };
  })();

  try {
    return await signOutInFlight;
  } finally {
    signOutInFlight = null;
  }
}
