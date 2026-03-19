import { supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";

export async function signOutToLogin() {
  await setNextAuthRoute("Login");
  return supabase.auth.signOut();
}
