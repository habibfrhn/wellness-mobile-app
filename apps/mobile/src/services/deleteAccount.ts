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

function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    if (typeof atob === "function") {
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    }

    return null;
  } catch {
    return null;
  }
}

function getProjectRefFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

function collectResponseDebug(response: Response) {
  return {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    wwwAuthenticate: response.headers.get("www-authenticate"),
    contentType: response.headers.get("content-type"),
    xSbErrorCode: response.headers.get("x-sb-error-code"),
    xRequestId: response.headers.get("x-request-id"),
  };
}


function stringifyDebug(data: unknown) {
  try {
    return JSON.stringify(data);
  } catch {
    return "<unserializable>";
  }
}

function logDebug(label: string, data: unknown) {
  console.log(`${label} ${stringifyDebug(data)}`);
}

function warnDebug(label: string, data: unknown) {
  console.warn(`${label} ${stringifyDebug(data)}`);
}

function errorDebug(label: string, data: unknown) {
  console.error(`${label} ${stringifyDebug(data)}`);
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
    const claims = decodeJwtClaims(session.access_token);
    const projectRef = process.env.EXPO_PUBLIC_SUPABASE_URL ? getProjectRefFromUrl(process.env.EXPO_PUBLIC_SUPABASE_URL) : null;

    logDebug("delete-account: using existing session token", {
      tokenPreview: maskToken(session.access_token),
      expiresAt: session.expires_at ?? null,
      tokenSub: claims?.sub ?? null,
      tokenAud: claims?.aud ?? null,
      tokenIss: claims?.iss ?? null,
      projectRefFromEnv: projectRef,
    });
    const tokenIss = typeof claims?.iss === "string" ? claims.iss : "";
    if (projectRef && tokenIss && !tokenIss.includes(projectRef)) {
      warnDebug("delete-account: token issuer does not match EXPO_PUBLIC_SUPABASE_URL project ref", {
        tokenIss,
        projectRefFromEnv: projectRef,
      });
    }
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

  const refreshedClaims = decodeJwtClaims(refreshedAccessToken);
  const projectRef = process.env.EXPO_PUBLIC_SUPABASE_URL ? getProjectRefFromUrl(process.env.EXPO_PUBLIC_SUPABASE_URL) : null;

  logDebug("delete-account: received refreshed token", {
    tokenPreview: maskToken(refreshedAccessToken),
    expiresAt: refreshed.session?.expires_at ?? null,
    tokenSub: refreshedClaims?.sub ?? null,
    tokenAud: refreshedClaims?.aud ?? null,
    tokenIss: refreshedClaims?.iss ?? null,
    projectRefFromEnv: projectRef,
  });
  const refreshedTokenIss = typeof refreshedClaims?.iss === "string" ? refreshedClaims.iss : "";
  if (projectRef && refreshedTokenIss && !refreshedTokenIss.includes(projectRef)) {
    warnDebug("delete-account: refreshed token issuer does not match EXPO_PUBLIC_SUPABASE_URL project ref", {
      tokenIss: refreshedTokenIss,
      projectRefFromEnv: projectRef,
    });
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
  let rawBody = "";

  try {
    rawBody = await response.text();
    payload = rawBody ? (JSON.parse(rawBody) as DeleteAccountResponse) : null;
  } catch {
    payload = null;
  }

  errorDebug("delete-account: parseFailure()", {
    ...collectResponseDebug(response),
    rawBody,
  });

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
    warnDebug("delete-account: local token validation failed", {
      error: error?.message ?? "missing-user",
      tokenPreview: maskToken(accessToken),
    });
    throw new Error(id.account.sessionMissing);
  }

  logDebug("delete-account: local token validation passed", {
    userId: data.user.id,
    email: data.user.email ?? null,
  });
}

async function requestDeleteAccountViaFetch(accessToken: string) {
  const functionUrl = getFunctionUrl();
  const anonKey = getAnonKey();

  logDebug("delete-account: requestDeleteAccountViaFetch() start", {
    functionUrl,
    tokenPreview: maskToken(accessToken),
    anonKeyLength: anonKey.length,
    authHeaderMode: "anon-key",
    projectRefFromEnv: getProjectRefFromUrl(functionUrl),
  });

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "x-user-jwt": accessToken,
      "x-client-info": "wellness-mobile-app/delete-account-v2",
    },
    body: JSON.stringify({}),
  });

  logDebug("delete-account: fetch response received", collectResponseDebug(response));

  if (!response.ok) {
    const failure = await parseFailure(response);
    errorDebug("delete-account: fetch delete function failed", {
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
  const anonKey = getAnonKey();

  logDebug("delete-account: requestDeleteAccountViaInvoke() start", {
    functionName: DELETE_ACCOUNT_FUNCTION_NAME,
    functionUrl: getFunctionUrl(),
    tokenPreview: maskToken(accessToken),
    authHeaderMode: "anon-key",
    projectRefFromEnv: process.env.EXPO_PUBLIC_SUPABASE_URL ? getProjectRefFromUrl(process.env.EXPO_PUBLIC_SUPABASE_URL) : null,
  });

  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(DELETE_ACCOUNT_FUNCTION_NAME, {
    body: {},
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "x-user-jwt": accessToken,
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

    errorDebug("delete-account: invoke delete function failed", {
      ...failure,
      invokeErrorName: error?.name ?? null,
      invokeErrorMessage: error?.message ?? null,
    });
    throw new Error(mapDeleteFailureToMessage(failure));
  }

  console.log("delete-account: requestDeleteAccountViaInvoke() success");
}

async function requestDeleteAccount(accessToken: string) {
  try {
    await requestDeleteAccountViaFetch(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    warnDebug("delete-account: fetch path failed, retrying with invoke path", { message });
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
