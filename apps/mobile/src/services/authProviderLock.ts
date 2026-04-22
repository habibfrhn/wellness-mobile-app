import { id } from "../i18n/strings";
import { supabase } from "./supabase";

export type LockedAuthProvider = "email" | "google" | "apple" | "github" | "unknown";
export type AuthAttemptMethod = "email_password" | "google_oauth" | "password_reset";

type ProviderLockResponse = {
  ok?: boolean;
  exists?: boolean;
  providers?: string[];
  primaryProvider?: string | null;
  providerLock?: string | null;
  code?: string;
};

export type ProviderLockLookupResult =
  | {
      status: "ok";
      exists: boolean;
      providers: string[];
      primaryProvider: LockedAuthProvider | null;
      providerLock: LockedAuthProvider | null;
    }
  | {
      status: "unavailable";
    };

function normalizeProvider(value: string | null | undefined): LockedAuthProvider | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "email" || normalized === "google" || normalized === "apple" || normalized === "github") {
    return normalized;
  }

  return "unknown";
}

function toUniqueProviders(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export async function lookupProviderLockByEmail(email: string): Promise<ProviderLockLookupResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { status: "ok", exists: false, providers: [], primaryProvider: null, providerLock: null };
  }

  const { data, error } = await supabase.functions.invoke<ProviderLockResponse>("resolve-auth-provider-lock", {
    body: { email: normalizedEmail },
  });

  if (error || !data?.ok) {
    return { status: "unavailable" };
  }

  return {
    status: "ok",
    exists: Boolean(data.exists),
    providers: toUniqueProviders(data.providers),
    primaryProvider: normalizeProvider(data.primaryProvider),
    providerLock: normalizeProvider(data.providerLock),
  };
}

export function getProviderLockErrorMessage(providerLock: LockedAuthProvider | null, attemptedMethod: AuthAttemptMethod): string {
  if (attemptedMethod === "password_reset") {
    return id.auth.providerLockPasswordResetBlocked;
  }

  return id.auth.providerLockSimple;
}

export function isBlockedByProviderLock(
  providerLock: LockedAuthProvider | null,
  attemptedMethod: AuthAttemptMethod,
  currentProvider: LockedAuthProvider | null
): boolean {
  if (!providerLock) {
    return false;
  }

  if (attemptedMethod === "email_password" || attemptedMethod === "password_reset") {
    return providerLock !== "email";
  }

  if (attemptedMethod === "google_oauth") {
    if (providerLock === "email") {
      return true;
    }

    return providerLock !== currentProvider;
  }

  return false;
}
