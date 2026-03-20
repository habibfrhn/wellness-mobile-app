import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthError } from "@supabase/supabase-js";

import { id } from "../i18n/strings";
import { setNextAuthRoute } from "./authStart";
import { supabase } from "./supabase";

type DeleteAccountResponse = {
  code?: string;
  message?: string;
};

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

async function deleteAccountViaRpc() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    throw error as DeleteAccountResponse & Error;
  }
}

function isDeleteAccountRpcMissing(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const rpcError = error as DeleteAccountResponse;
  return rpcError.code === "PGRST202" || rpcError.message?.includes("delete_my_account") === true;
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
    await deleteAccountViaRpc();
  } catch (error) {
    if (isDeleteAccountRpcMissing(error)) {
      throw new Error(id.account.deleteSetupRequired);
    }

    const message = error instanceof Error ? error.message : "";
    throw new Error(message || id.account.deleteFailed);
  }

  await signOutAfterDeletion();
}
