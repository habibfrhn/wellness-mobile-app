import { AuthError } from "@supabase/supabase-js";

import { id } from "../i18n/strings";
import { setNextAuthRoute } from "./authStart";
import { supabase } from "./supabase";

type DeleteAccountResponse = {
  ok?: boolean;
  error?: string;
};

function isMissingSessionError(error: unknown) {
  return error instanceof AuthError && error.name === "AuthSessionMissingError";
}

async function signOutAfterDeletion() {
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error && !isMissingSessionError(error)) {
    throw error;
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

  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>("delete-account", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(data?.error || "Failed to delete account");
  }

  await signOutAfterDeletion();
}
