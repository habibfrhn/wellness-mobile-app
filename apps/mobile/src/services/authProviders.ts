import type { User } from "@supabase/supabase-js";

function normalizeProviders(user: User | null | undefined) {
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
  return normalizeProviders(user).includes("email");
}
