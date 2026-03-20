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

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (!error) {
    return;
  }

  if (!isMissingSessionError(error)) {
    throw error;
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

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/delete-account`;
}

async function requestDeleteAccount(accessToken: string) {
  const response = await fetch(getDeleteAccountFunctionUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  let payload: DeleteAccountResponse | null = null;
  try {
    payload = (await response.json()) as DeleteAccountResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || id.account.deleteFailed);
  }
}

export async function deleteCurrentAccount() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error(id.account.sessionMissing);
  }

  try {
    await requestDeleteAccount(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isNetworkFailure =
      message.includes("Failed to fetch") ||
      message.includes("Network request failed") ||
      message.includes("Edge Function");
    if (isNetworkFailure) {
      throw new Error(id.account.deleteUnavailable);
    }

    throw error;
  }

  await signOutAfterDeletion();
}
