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
  console.log("delete-account: signOutAfterDeletion() started");
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error && !isMissingSessionError(error)) {
    // Continue with local cleanup so users are never left logged in on-device
    // even if global sign-out fails after account deletion.
    console.warn("delete-account: global sign-out failed after deletion", error.message);
  }

  await clearPersistedSession();
  console.log("delete-account: local persisted session cleared");

  if (Platform.OS === "web" && typeof window !== "undefined") {
    console.log("delete-account: redirecting web user to root after deletion");
    window.location.assign("/");
  }
}

function getDeleteAccountFunctionUrl() {
  if (!supabaseUrl) {
    throw new Error(id.account.deleteUnavailable);
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${DELETE_ACCOUNT_FUNCTION_NAME}`;
}

async function getCurrentAccessToken(forceRefresh = false) {
  console.log("delete-account: fetching current session token", { forceRefresh });
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session?.access_token && !forceRefresh) {
    console.log("delete-account: found active access token in session");
    return session.access_token;
  }

  console.log("delete-account: refreshing session token");
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    throw refreshError;
  }

  const refreshedAccessToken = refreshed.session?.access_token;
  if (!refreshedAccessToken) {
    console.error("delete-account: refresh succeeded but access token is still missing");
    throw new Error(id.account.sessionMissing);
  }

  console.log("delete-account: obtained refreshed access token");
  return refreshedAccessToken;
}

async function requestDeleteAccount(accessToken: string) {
  console.log("delete-account: calling delete-user-account edge function");
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
    console.error("delete-account: edge function returned failure", {
      status: response.status,
      payloadCode: payload?.code ?? null,
      payloadError: payload?.error ?? null,
    });
    if (response.status === 401) {
      throw new Error(id.account.sessionMissing);
    }
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

  console.log("delete-account: edge function deletion succeeded");
}

async function deleteAccountViaFunction() {
  console.log("delete-account: deleteAccountViaFunction() started");
  let accessToken = await getCurrentAccessToken();
  try {
    await requestDeleteAccount(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== id.account.sessionMissing) {
      console.error("delete-account: non-session failure, aborting retry", { message, error });
      throw error;
    }

    console.warn("delete-account: session missing, refreshing and retrying once");
    accessToken = await getCurrentAccessToken(true);
    await requestDeleteAccount(accessToken);
  }
}

export async function deleteCurrentAccount() {
  console.log("delete-account: deleteCurrentAccount() started");
  await deleteAccountViaFunction();
  await signOutAfterDeletion();
  console.log("delete-account: deleteCurrentAccount() finished");
}
