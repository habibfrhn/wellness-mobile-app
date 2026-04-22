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

  logAuthDebugEvent("info", "provider_lock_cleanup_decision", {
    source,
    expectedProviderLock: normalizedProviderLock || null,
    sessionUserId: session.user.id,
    sessionIdentityProviders: identityProviders,
  });

  if (normalizedProviderLock !== "email") {
    logAuthDebugEvent("info", "provider_lock_cleanup_skipped", {
      source,
      reason: "NO_EMAIL_PROVIDER_LOCK",
      sessionUserId: session.user.id,
    });
    return;
  }

  const oauthIdentity = identityRecords.find((identity) => identity.provider !== "email");
  if (!oauthIdentity) {
    logAuthDebugEvent("info", "provider_lock_cleanup_skipped", {
      source,
      reason: "NO_OAUTH_IDENTITY_TO_REMOVE",
      sessionUserId: session.user.id,
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
    return;
  }

  logAuthDebugEvent("info", "provider_lock_cleanup_success", {
    source,
    removedProvider: oauthIdentity.provider,
    sessionUserId: session.user.id,
  });
}
