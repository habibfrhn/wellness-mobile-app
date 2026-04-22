import type { Session, UserIdentity } from "@supabase/supabase-js";

import { logAuthDebugEvent } from "./authDebug";
import { supabase } from "./supabase";

type CleanupOAuthIdentityOptions = {
  session: Session;
  expectedProviderLock: string | null | undefined;
  source: string;
  attemptedProvider?: string | null;
};

type IdentityRecord = {
  id: string;
  provider: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function toIdentityRecord(identity: UserIdentity): IdentityRecord | null {
  const id = typeof identity.identity_id === "string" ? identity.identity_id.trim() : "";
  const providerRaw = typeof identity.provider === "string" ? identity.provider : "";
  const provider = providerRaw.trim().toLowerCase();

  if (!id || !provider) {
    return null;
  }

  return {
    id,
    provider,
  };
}

function listIdentityRecords(session: Session): IdentityRecord[] {
  const identities = Array.isArray(session.user.identities) ? session.user.identities : [];
  return identities
    .map((identity) => toIdentityRecord(identity))
    .filter((identity): identity is IdentityRecord => Boolean(identity));
}

function getDistinctIdentityRecords(identityRecords: IdentityRecord[]) {
  const uniqueById = new Map<string, IdentityRecord>();
  identityRecords.forEach((identity) => {
    if (!uniqueById.has(identity.id)) {
      uniqueById.set(identity.id, identity);
    }
  });
  return [...uniqueById.values()];
}

async function listCurrentIdentityRecords(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return {
      identityRecords: [] as IdentityRecord[],
      error: error?.message ?? "GET_USER_FAILED",
    };
  }

  const identities = Array.isArray(data.user.identities) ? data.user.identities : [];
  return {
    identityRecords: identities
      .map((identity) => toIdentityRecord(identity))
      .filter((identity): identity is IdentityRecord => Boolean(identity)),
    error: null,
  };
}

async function unlinkIdentityById(identityId: string, accessToken: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user/identities/${identityId}`, {
    method: "DELETE",
    headers: {
      apikey: supabaseAnonKey ?? "",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok || response.status === 404) {
    return { ok: true as const, status: response.status, errorBody: null };
  }

  const errorBody = await response.text();
  return { ok: false as const, status: response.status, errorBody };
}

export async function cleanupOAuthIdentityOnProviderMismatch({
  session,
  expectedProviderLock,
  source,
  attemptedProvider,
}: CleanupOAuthIdentityOptions) {
  const normalizedProviderLock = (expectedProviderLock ?? "").trim().toLowerCase();
  const normalizedAttemptedProvider = (attemptedProvider ?? "").trim().toLowerCase();
  const sessionIdentityRecords = listIdentityRecords(session);
  const currentIdentityLookup = await listCurrentIdentityRecords(session.access_token);
  if (currentIdentityLookup.error) {
    logAuthDebugEvent("warn", "provider_lock_cleanup_get_user_failed", {
      source,
      sessionUserId: session.user.id,
      error: currentIdentityLookup.error,
    });
  }
  const identityRecords = getDistinctIdentityRecords([...sessionIdentityRecords, ...currentIdentityLookup.identityRecords]);
  const identityProviders = identityRecords.map((identity) => identity.provider);
  const hasEmailIdentity = identityProviders.includes("email");
  const oauthIdentities = identityRecords.filter((identity) => identity.provider !== "email");
  const targetedOauthIdentities = normalizedAttemptedProvider
    ? oauthIdentities.filter((identity) => identity.provider === normalizedAttemptedProvider)
    : oauthIdentities;
  const identitiesToRemove = targetedOauthIdentities.length > 0 ? targetedOauthIdentities : oauthIdentities;

  logAuthDebugEvent("info", "provider_lock_cleanup_decision", {
    source,
    expectedProviderLock: normalizedProviderLock || null,
    attemptedProvider: normalizedAttemptedProvider || null,
    sessionUserId: session.user.id,
    sessionIdentityProviders: sessionIdentityRecords.map((identity) => identity.provider),
    mergedIdentityProviders: identityProviders,
  });

  const shouldCleanupOAuthIdentity =
    identitiesToRemove.length > 0 &&
    hasEmailIdentity &&
    (normalizedProviderLock === "email" || normalizedProviderLock.length === 0 || normalizedProviderLock === "unknown");

  if (!shouldCleanupOAuthIdentity) {
    logAuthDebugEvent("info", "provider_lock_cleanup_skipped", {
      source,
      reason: identitiesToRemove.length === 0 ? "NO_OAUTH_IDENTITY_TO_REMOVE" : "NO_EMAIL_OAUTH_MISMATCH",
      sessionUserId: session.user.id,
      expectedProviderLock: normalizedProviderLock || null,
      sessionIdentityProviders: identityProviders,
    });
    return;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    logAuthDebugEvent("warn", "provider_lock_cleanup_skipped", {
      source,
      reason: "SUPABASE_ENV_MISSING",
      sessionUserId: session.user.id,
    });
    return;
  }

  const cleanupResults = await Promise.all(identitiesToRemove.map(async (oauthIdentity) => {
    const unlinkResult = await unlinkIdentityById(oauthIdentity.id, session.access_token);

    if (!unlinkResult.ok) {
      logAuthDebugEvent("warn", "provider_lock_cleanup_failed", {
        source,
        reason: "UNLINK_IDENTITY_FAILED",
        status: unlinkResult.status,
        provider: oauthIdentity.provider,
        sessionUserId: session.user.id,
        error: unlinkResult.errorBody?.slice(0, 300) ?? null,
      });
      return false;
    }

    logAuthDebugEvent("info", "provider_lock_cleanup_success", {
      source,
      removedProvider: oauthIdentity.provider,
      sessionUserId: session.user.id,
    });
    return true;
  }));

  if (cleanupResults.every(Boolean)) {
    const afterCleanup = await listCurrentIdentityRecords(session.access_token);
    if (afterCleanup.error) {
      logAuthDebugEvent("warn", "provider_lock_cleanup_verify_failed", {
        source,
        sessionUserId: session.user.id,
        error: afterCleanup.error,
      });
      return;
    }

    const hasRemainingAttemptedProvider = identitiesToRemove.some((identity) =>
      afterCleanup.identityRecords.some(
        (record) => record.provider === identity.provider && record.id === identity.id,
      ),
    );

    if (!hasRemainingAttemptedProvider) {
      return;
    }

    logAuthDebugEvent("warn", "provider_lock_cleanup_verify_remaining_identity", {
      source,
      sessionUserId: session.user.id,
      remainingProviders: afterCleanup.identityRecords.map((identity) => identity.provider),
    });
    return;
  }

  logAuthDebugEvent("warn", "provider_lock_cleanup_partial", {
    source,
    sessionUserId: session.user.id,
    attemptedCount: identitiesToRemove.length,
    successCount: cleanupResults.filter(Boolean).length,
  });
}
