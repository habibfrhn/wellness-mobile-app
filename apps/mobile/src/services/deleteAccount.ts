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

type DeleteAccountFailure = {
  status: number | null;
  code: string | null;
  error: string | null;
};

const DELETE_ACCOUNT_FUNCTION_NAME = "delete-user-account";

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
    console.warn("delete-account: global sign-out failed after deletion", error.message);
  }

  await clearPersistedSession();

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign("/");
  }
}

async function getCurrentAccessToken(forceRefresh = false) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session?.access_token && !forceRefresh) {
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

function getFunctionUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error(id.account.deleteUnavailable);
  }

  return `${baseUrl}/functions/v1/${DELETE_ACCOUNT_FUNCTION_NAME}`;
}

function getAnonKey() {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error(id.account.deleteUnavailable);
  }

  return anonKey;
}

async function parseFailure(response: Response): Promise<DeleteAccountFailure> {
  let payload: DeleteAccountResponse | null = null;

  try {
    payload = (await response.json()) as DeleteAccountResponse;
  } catch {
    payload = null;
  }

  return {
    status: response.status,
    code: payload?.code ?? null,
    error: payload?.error ?? null,
  };
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

async function requestDeleteAccount(accessToken: string) {
  const response = await fetch(getFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: getAnonKey(),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const failure = await parseFailure(response);
    throw new Error(mapDeleteFailureToMessage(failure));
  }

  let payload: DeleteAccountResponse | null = null;
  try {
    payload = (await response.json()) as DeleteAccountResponse;
  } catch {
    payload = null;
  }

  if (!payload?.ok) {
    throw new Error(id.account.deleteFailed);
  }
}

async function deleteAccountViaFunction() {
  try {
    const accessToken = await getCurrentAccessToken(false);
    await requestDeleteAccount(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== id.account.sessionMissing) {
      throw error;
    }

    const refreshedAccessToken = await getCurrentAccessToken(true);
    await requestDeleteAccount(refreshedAccessToken);
  }
}

export async function deleteCurrentAccount() {
  await deleteAccountViaFunction();
  await signOutAfterDeletion();
}
