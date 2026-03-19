import { supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";

type SignOutScope = "global" | "local" | "others";

export async function signOutToLogin(scope: SignOutScope = "global") {
  await setNextAuthRoute("Login");
  return supabase.auth.signOut({ scope });
}
