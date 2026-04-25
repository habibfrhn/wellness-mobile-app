import { Platform } from "react-native";
import { AuthError } from "@supabase/supabase-js";

import { id } from "../i18n/strings";
import { setNextAuthRoute } from "./authStart";
import { clearSupabaseNativeAuthArtifacts, getRelatedAuthStorageKeys } from "./authStorage";
import { supabase } from "./supabase";

type DeleteAccountResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
};

type DeleteAccountFailure = {
  status: number | null;
  code: string | null;
  error: string | null;
};

const DELETE_ACCOUNT_FUNCTION_NAME = "delete-account-v2";

function isMissingSessionError(error: unknown) {
  return error instanceof AuthError && error.name === "AuthSessionMissingError";
}

function isIgnorableSignOutErrorAfterDeletion(error: unknown) {
  if (!error) {
    return false;
  }

  if (isMissingSessionError(error)) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("session") ||
    message.includes("refresh token") ||
    message.includes("user from sub claim in jwt does not exist")
  );
}

async function clearPersistedSession() {
  const storageKey = (supabase.auth as unknown as { storageKey?: string }).storageKey ?? null;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const keys = getRelatedAuthStorageKeys(storageKey);
    for (const key of keys) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
    return;
  }

  await clearSupabaseNativeAuthArtifacts(storageKey);
}

async function signOutAfterDeletion() {
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error && !isIgnorableSignOutErrorAfterDeletion(error)) {
    throw error;
  }

  if (error) {
    console.warn("delete-account: signOut fallback cleanup triggered", error.message);
  }

  await clearPersistedSession();
}

async function getCurrentAccessToken(forceRefresh = false) {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      throw error;
    }

    const refreshedAccessToken = data.session?.access_token;
    if (!refreshedAccessToken) {
      throw new Error(id.account.sessionMissing);
    }

    return refreshedAccessToken;
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.access_token) {
    throw new Error(id.account.sessionMissing);
  }

  return session.access_token;
}

function mapDeleteFailureToMessage(failure: DeleteAccountFailure) {
  if (failure.status === 401 || failure.code === "INVALID_SESSION" || failure.code === "MISSING_USER_TOKEN") {
    return id.account.sessionMissing;
  }

  if (
    failure.status === 403 ||
    failure.status === 404 ||
    failure.code === "SERVER_MISCONFIGURATION" ||
    failure.code === "METHOD_NOT_ALLOWED"
  ) {
    return id.account.deleteUnavailable;
  }

  if (failure.status === 429 || failure.code === "RATE_LIMITED") {
    return id.common.tryAgain;
  }

  return id.account.deleteFailed;
}

async function validateTokenLocally(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error(id.account.sessionMissing);
  }
}

function parseDeleteFailure(result: DeleteAccountResponse | null, error: unknown): DeleteAccountFailure {
  const invokeError = error as { context?: { status?: number }; message?: string } | null;
  return {
    status: typeof invokeError?.context?.status === "number" ? invokeError.context.status : null,
    code: result?.code ?? null,
    error: result?.error ?? invokeError?.message ?? null,
  };
}

async function requestDeleteAccount(accessToken: string) {
  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(DELETE_ACCOUNT_FUNCTION_NAME, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-client-info": "wellness-mobile-app/delete-account-v2",
    },
  });

  if (error || !data?.ok) {
    const failure = parseDeleteFailure(data ?? null, error);
    console.warn("delete-account: function invoke failed", failure);
    throw new Error(mapDeleteFailureToMessage(failure));
  }
}

async function deleteAccountViaFunction() {
  const initialAccessToken = await getCurrentAccessToken(false);
  await validateTokenLocally(initialAccessToken);

  try {
    await requestDeleteAccount(initialAccessToken);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== id.account.sessionMissing) {
      throw error;
    }
  }

  const refreshedAccessToken = await getCurrentAccessToken(true);
  await validateTokenLocally(refreshedAccessToken);
  await requestDeleteAccount(refreshedAccessToken);
}

export async function deleteCurrentAccount() {
  await deleteAccountViaFunction();
  await signOutAfterDeletion();
}
