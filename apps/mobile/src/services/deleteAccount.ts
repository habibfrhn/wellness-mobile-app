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

const DELETE_ACCOUNT_FUNCTION_NAME = "delete-account-v2";

function isMissingSessionError(error: unknown) {
  return error instanceof AuthError && error.name === "AuthSessionMissingError";
}

function maskToken(token: string) {
  if (token.length <= 14) {
    return `${token.slice(0, 3)}...`;
  }

  return `${token.slice(0, 7)}...${token.slice(-5)}`;
}

async function clearPersistedSession() {
  const storageKey = (supabase.auth as unknown as { storageKey?: string }).storageKey;
  if (!storageKey) {
    console.log("delete-account: no auth storageKey found, skipping local cleanup");
    return;
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    console.log("delete-account: clearing web localStorage key", { storageKey });
    window.localStorage.removeItem(storageKey);
    return;
  }

  console.log("delete-account: clearing native AsyncStorage key", { storageKey });
  await AsyncStorage.removeItem(storageKey);
}

async function signOutAfterDeletion() {
  console.log("delete-account: signOutAfterDeletion() start");
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error && !isMissingSessionError(error)) {
    console.warn("delete-account: global sign-out failed after deletion", error.message);
  }

  await clearPersistedSession();

  if (Platform.OS === "web" && typeof window !== "undefined") {
    console.log("delete-account: redirecting web user to root after deletion");
    window.location.assign("/");
  }

  console.log("delete-account: signOutAfterDeletion() done");
}

async function getCurrentAccessToken(forceRefresh = false) {
  console.log("delete-account: getCurrentAccessToken()", { forceRefresh });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("delete-account: getSession() failed", sessionError.message);
    throw sessionError;
  }

  if (session?.access_token && !forceRefresh) {
    console.log("delete-account: using existing session token", {
      tokenPreview: maskToken(session.access_token),
      expiresAt: session.expires_at ?? null,
    });
    return session.access_token;
  }

  console.log("delete-account: refreshing session token");
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    console.error("delete-account: refreshSession() failed", refreshError.message);
    throw refreshError;
  }

  const refreshedAccessToken = refreshed.session?.access_token;
  if (!refreshedAccessToken) {
    console.error("delete-account: refreshed session missing access token");
    throw new Error(id.account.sessionMissing);
  }

  console.log("delete-account: received refreshed token", {
    tokenPreview: maskToken(refreshedAccessToken),
    expiresAt: refreshed.session?.expires_at ?? null,
  });
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

async function validateTokenLocally(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    console.warn("delete-account: local token validation failed", {
      error: error?.message ?? "missing-user",
      tokenPreview: maskToken(accessToken),
    });
    throw new Error(id.account.sessionMissing);
  }

  console.log("delete-account: local token validation passed", {
    userId: data.user.id,
    email: data.user.email ?? null,
  });
}

async function requestDeleteAccountViaFetch(accessToken: string) {
  const functionUrl = getFunctionUrl();
  console.log("delete-account: requestDeleteAccountViaFetch() start", {
    functionUrl,
    tokenPreview: maskToken(accessToken),
  });

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: getAnonKey(),
      "x-client-info": "wellness-mobile-app/delete-account-v2",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const failure = await parseFailure(response);
    console.error("delete-account: fetch delete function failed", {
      status: failure.status,
      code: failure.code,
      error: failure.error,
    });
    throw new Error(mapDeleteFailureToMessage(failure));
  }

  let payload: DeleteAccountResponse | null = null;
  try {
    payload = (await response.json()) as DeleteAccountResponse;
  } catch {
    payload = null;
  }

  if (!payload?.ok) {
    console.error("delete-account: fetch delete function returned unexpected payload", payload);
    throw new Error(id.account.deleteFailed);
  }

  console.log("delete-account: requestDeleteAccountViaFetch() success");
}

async function requestDeleteAccountViaInvoke(accessToken: string) {
  console.log("delete-account: requestDeleteAccountViaInvoke() start", {
    functionName: DELETE_ACCOUNT_FUNCTION_NAME,
    tokenPreview: maskToken(accessToken),
  });

  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(DELETE_ACCOUNT_FUNCTION_NAME, {
    body: {},
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: getAnonKey(),
      "x-client-info": "wellness-mobile-app/delete-account-v2",
    },
  });

  if (error || !data?.ok) {
    const details = error as { context?: { status?: number } };
    const failure: DeleteAccountFailure = {
      status: typeof details?.context?.status === "number" ? details.context.status : null,
      code: data?.code ?? null,
      error: data?.error ?? error?.message ?? null,
    };

    console.error("delete-account: invoke delete function failed", failure);
    throw new Error(mapDeleteFailureToMessage(failure));
  }

  console.log("delete-account: requestDeleteAccountViaInvoke() success");
}

async function requestDeleteAccount(accessToken: string) {
  try {
    await requestDeleteAccountViaFetch(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    console.warn("delete-account: fetch path failed, retrying with invoke path", { message });
    await requestDeleteAccountViaInvoke(accessToken);
  }
}

async function deleteAccountViaFunction() {
  console.log("delete-account: deleteAccountViaFunction() start");

  try {
    const accessToken = await getCurrentAccessToken(false);
    await validateTokenLocally(accessToken);
    await requestDeleteAccount(accessToken);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== id.account.sessionMissing) {
      console.error("delete-account: non-session error on first attempt", { message, error });
      throw error;
    }

    console.warn("delete-account: session appears missing/invalid, refreshing once and retrying");
  }

  const refreshedAccessToken = await getCurrentAccessToken(true);
  await validateTokenLocally(refreshedAccessToken);
  await requestDeleteAccount(refreshedAccessToken);
}

export async function deleteCurrentAccount() {
  console.log("delete-account: deleteCurrentAccount() start");
  await deleteAccountViaFunction();
  await signOutAfterDeletion();
  console.log("delete-account: deleteCurrentAccount() success");
}
