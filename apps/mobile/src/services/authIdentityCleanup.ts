import type { Session, UserIdentity } from "@supabase/supabase-js";

import { logAuthDebugEvent } from "./authDebug";

type CleanupOAuthIdentityOptions = {
  session: Session;
  expectedProviderLock: string | null | undefined;
  source: string;
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

export async function cleanupOAuthIdentityOnProviderMismatch({
  session,
  expectedProviderLock,
  source,
}: CleanupOAuthIdentityOptions) {
  const normalizedProviderLock = (expectedProviderLock ?? "").trim().toLowerCase();
  const identityRecords = listIdentityRecords(session);
  const identityProviders = identityRecords.map((identity) => identity.provider);
  const hasEmailIdentity = identityProviders.includes("email");
  const oauthIdentities = identityRecords.filter((identity) => identity.provider !== "email");

  logAuthDebugEvent("info", "provider_lock_cleanup_decision", {
    source,
    expectedProviderLock: normalizedProviderLock || null,
    sessionUserId: session.user.id,
    sessionIdentityProviders: identityProviders,
  });

  const shouldCleanupOAuthIdentity =
    oauthIdentities.length > 0 &&
    hasEmailIdentity &&
    (normalizedProviderLock === "email" || normalizedProviderLock.length === 0 || normalizedProviderLock === "unknown");

  if (!shouldCleanupOAuthIdentity) {
    logAuthDebugEvent("info", "provider_lock_cleanup_skipped", {
      source,
      reason: oauthIdentities.length === 0 ? "NO_OAUTH_IDENTITY_TO_REMOVE" : "NO_EMAIL_OAUTH_MISMATCH",
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

  const cleanupResults = await Promise.all(
    oauthIdentities.map(async (oauthIdentity) => {
      const response = await fetch(`${supabaseUrl}/auth/v1/user/identities/${oauthIdentity.id}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logAuthDebugEvent("warn", "provider_lock_cleanup_failed", {
          source,
          reason: "UNLINK_IDENTITY_FAILED",
          status: response.status,
          provider: oauthIdentity.provider,
          sessionUserId: session.user.id,
          error: errorBody.slice(0, 300),
        });
        return false;
      }

      logAuthDebugEvent("info", "provider_lock_cleanup_success", {
        source,
        removedProvider: oauthIdentity.provider,
        sessionUserId: session.user.id,
      });
      return true;
    }),
  );

  if (cleanupResults.every(Boolean)) {
    return;
  }

  logAuthDebugEvent("warn", "provider_lock_cleanup_partial", {
    source,
    sessionUserId: session.user.id,
    attemptedCount: oauthIdentities.length,
    successCount: cleanupResults.filter(Boolean).length,
  });
}
