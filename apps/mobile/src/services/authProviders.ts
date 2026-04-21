import type { User } from "@supabase/supabase-js";

export function getUserAuthProviders(user: User | null | undefined) {
  const providers = user?.app_metadata?.providers;

  if (Array.isArray(providers)) {
    return providers.filter((value): value is string => typeof value === "string");
  }

  const singleProvider = user?.app_metadata?.provider;
  if (typeof singleProvider === "string" && singleProvider.length > 0) {
    return [singleProvider];
  }

  return [];
}

export function canManagePassword(user: User | null | undefined) {
  return getUserAuthProviders(user).includes("email");
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
  return getUserAuthProviders(user).some((provider) => provider !== "email");
}
