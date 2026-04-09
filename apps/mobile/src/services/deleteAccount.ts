import { id } from "../i18n/strings";
import { clearPersistedAuthSession, isMissingSessionError } from "./authSession";
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


async function signOutAfterDeletion() {
  await setNextAuthRoute("Login");

  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error && !isMissingSessionError(error)) {
    throw error;
  }

  await clearPersistedAuthSession();
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
    const rawBody = await response.text();
    payload = rawBody ? (JSON.parse(rawBody) as DeleteAccountResponse) : null;
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
    throw new Error(id.account.sessionMissing);
  }
}

async function requestDeleteAccountViaFetch(accessToken: string) {
  const functionUrl = getFunctionUrl();
  const anonKey = getAnonKey();

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "x-client-info": "wellness-mobile-app/delete-account-v2",
    },
    body: JSON.stringify({ userJwt: accessToken }),
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

async function requestDeleteAccountViaInvoke(accessToken: string) {
  const anonKey = getAnonKey();

  const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(DELETE_ACCOUNT_FUNCTION_NAME, {
    body: { userJwt: accessToken },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
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

    throw new Error(mapDeleteFailureToMessage(failure));
  }
}

async function requestDeleteAccount(accessToken: string) {
  try {
    await requestDeleteAccountViaFetch(accessToken);
  } catch {
    await requestDeleteAccountViaInvoke(accessToken);
  }
}

async function deleteAccountViaFunction() {
  try {
    const accessToken = await getCurrentAccessToken(false);
    await validateTokenLocally(accessToken);
    await requestDeleteAccount(accessToken);
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
