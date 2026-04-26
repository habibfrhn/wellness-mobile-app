import type { User } from "@supabase/supabase-js";

export function getUserAuthProviders(user: User | null | undefined) {
  const providerSet = new Set<string>();

  const identities = user?.identities;
  if (Array.isArray(identities)) {
    for (const identity of identities) {
      const provider = identity?.provider;
      if (typeof provider === "string" && provider.trim().length > 0) {
        providerSet.add(provider.trim().toLowerCase());
      }
    }
  }

  const providers = user?.app_metadata?.providers;

  if (Array.isArray(providers)) {
    for (const provider of providers) {
      if (typeof provider === "string" && provider.trim().length > 0) {
        providerSet.add(provider.trim().toLowerCase());
      }
    }
  }

  const singleProvider = user?.app_metadata?.provider;
  if (typeof singleProvider === "string" && singleProvider.length > 0) {
    providerSet.add(singleProvider.trim().toLowerCase());
  }

  const sortedProviders = Array.from(providerSet);
  const priority = new Map<string, number>([
    ["email", 0],
    ["google", 1],
  ]);

  sortedProviders.sort((a, b) => {
    const aRank = priority.get(a) ?? 99;
    const bRank = priority.get(b) ?? 99;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.localeCompare(b);
  });

  return sortedProviders;
}

export function canManagePassword(user: User | null | undefined) {
  return getUserAuthProviders(user).includes("email");
}

export function getAuthProviderLabel(provider: string) {
  if (provider === "email") {
    return "Email + Password";
  }

  if (provider === "google") {
    return "Google";
  }

  return provider;
}

export function isUserVerified(user: User | null | undefined) {
  if (!user) {
    return false;
  }

  const legacyConfirmedAt =
    typeof (user as { confirmed_at?: unknown }).confirmed_at === "string"
      ? ((user as { confirmed_at?: string }).confirmed_at ?? null)
      : null;
  const metadataEmailVerified =
    typeof (user.user_metadata as { email_verified?: unknown } | undefined)?.email_verified === "boolean"
      ? ((user.user_metadata as { email_verified?: boolean }).email_verified ?? false)
      : false;

  if (user.email_confirmed_at || user.phone_confirmed_at || legacyConfirmedAt || metadataEmailVerified) {
    return true;
  }

  // OAuth providers (e.g. Google) are already identity-verified by the provider,
  // and may not populate `email_confirmed_at` in the same way as email/password.
  return getUserAuthProviders(user).some((provider) => provider !== "email");
}
