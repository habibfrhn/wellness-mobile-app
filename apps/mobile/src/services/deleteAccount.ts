import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthError } from "@supabase/supabase-js";

import { id } from "../i18n/strings";
import { setNextAuthRoute } from "./authStart";
import { supabase } from "./supabase";

type DeleteAccountResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
};

const DELETE_ACCOUNT_FUNCTION_NAME = "delete-user-account";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function isMissingSessionError(error: unknown) {
  return error instanceof AuthError && error.name === "AuthSessionMissingError";
}

async function clearPersistedSession() {
  const storageKey = (supabase.auth as unknown as { storageKey?: string }).storageKey;
  if (!storageKey) {
    return;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey);
    return;
  }

  await AsyncStorage.removeItem(storageKey);
}

async function signOutAfterDeletion() {
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error && !isMissingSessionError(error)) {
    // Continue with local cleanup so users are never left logged in on-device
    // even if global sign-out fails after account deletion.
    console.warn("delete-account: global sign-out failed after deletion", error.message);
  }

  await clearPersistedSession();

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign("/");
  }
}

function getDeleteAccountFunctionUrl() {
  if (!supabaseUrl) {
    throw new Error(id.account.deleteUnavailable);
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${DELETE_ACCOUNT_FUNCTION_NAME}`;
}

async function getCurrentAccessToken() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session?.access_token) {
    return session.access_token;
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    throw refreshError;
  }

  const refreshedAccessToken = refreshed.session?.access_token;
  if (!refreshedAccessToken) {
    throw new Error(id.account.sessionMissing);
  }

  return refreshedAccessToken;
}

async function requestDeleteAccount(accessToken: string) {
  let response: Response;
  try {
    response = await fetch(getDeleteAccountFunctionUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  } catch {
    throw new Error(id.account.deleteUnavailable);
  }

  let payload: DeleteAccountResponse | null = null;
  try {
    payload = (await response.json()) as DeleteAccountResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    if (response.status === 404 || response.status === 403) {
      throw new Error(id.account.deleteUnavailable);
    }
    if (payload?.code === "RATE_LIMITED") {
      throw new Error(id.common.tryAgain);
    }
    if (payload?.code === "SERVER_MISCONFIGURATION" || payload?.code === "METHOD_NOT_ALLOWED") {
      throw new Error(id.account.deleteUnavailable);
    }
    if (payload?.code === "INVALID_SESSION" || payload?.code === "MISSING_USER_TOKEN") {
      throw new Error(id.account.sessionMissing);
    }
    throw new Error(id.account.deleteFailed);
  }
}

async function deleteAccountViaFunction() {
  let accessToken = await getCurrentAccessToken();
  try {
    await requestDeleteAccount(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== id.account.sessionMissing) {
      throw error;
    }

    accessToken = await getCurrentAccessToken();
    await requestDeleteAccount(accessToken);
  }
}

export async function deleteCurrentAccount() {
  await deleteAccountViaFunction();
  await signOutAfterDeletion();
}
