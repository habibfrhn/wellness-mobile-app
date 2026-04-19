import type { User } from "@supabase/supabase-js";

function normalizeProviders(user: User | null | undefined) {
  const providers = new Set<string>();

  const appMetadataProviders = user?.app_metadata?.providers;
  if (Array.isArray(appMetadataProviders)) {
    for (const value of appMetadataProviders) {
      if (typeof value === "string" && value.length > 0) {
        providers.add(value);
      }
    }
  }

  const appMetadataProvider = user?.app_metadata?.provider;
  if (typeof appMetadataProvider === "string" && appMetadataProvider.length > 0) {
    providers.add(appMetadataProvider);
  }

  const identities = user?.identities;
  if (Array.isArray(identities)) {
    for (const identity of identities) {
      if (typeof identity?.provider === "string" && identity.provider.length > 0) {
        providers.add(identity.provider);
      }
    }
  }

  return Array.from(providers);
}

export function canManagePassword(user: User | null | undefined) {
  return normalizeProviders(user).includes("email");
}

export function isUserVerified(user: User | null | undefined) {
  if (!user) {
    return false;
  }

  if (user.email_confirmed_at || user.phone_confirmed_at) {
    return true;
  }

  // OAuth providers (e.g. Google) are already identity-verified by the provider,
  // and may not populate `email_confirmed_at` in the same way as email/password.
  return normalizeProviders(user).some((provider) => provider !== "email");
}
