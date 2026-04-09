import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthError } from "@supabase/supabase-js";

import { supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";

type SignOutScope = "global" | "local" | "others";

export function isMissingSessionError(error: unknown) {
  return error instanceof AuthError && error.name === "AuthSessionMissingError";
}

export async function clearPersistedAuthSession() {
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

export async function signOutToLogin(scope: SignOutScope = "global") {
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope });
  if (error && !isMissingSessionError(error)) {
    return { error };
  }

  await clearPersistedAuthSession();
  return { error: null };
}
