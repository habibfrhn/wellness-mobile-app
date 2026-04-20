import { supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";

type SignOutScope = "global" | "local" | "others";

export async function signOutToLogin(scope: SignOutScope = "global") {
  await setNextAuthRoute("Login");

  const globalResult = await supabase.auth.signOut({ scope });
  if (!globalResult.error) {
    return globalResult;
  }

  if (scope === "global") {
    const localFallbackResult = await supabase.auth.signOut({ scope: "local" });
    if (!localFallbackResult.error) {
      return localFallbackResult;
    }
  }

  return globalResult;
}
