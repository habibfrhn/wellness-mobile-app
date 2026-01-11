import * as Linking from "expo-linking";
import { supabase } from "./supabase";

/**
 * Handles Supabase auth links such as:
 * - wellnessapp://auth/callback?code=...
 * - wellnessapp://auth/reset?code=...
 *
 * Supabase uses a code exchange flow in mobile (PKCE).
 */
export async function handleAuthLink(url: string) {
  const parsed = Linking.parse(url);

  const path = (parsed.path ?? "").toLowerCase();
  const code =
    typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
  const type =
    typeof parsed.queryParams?.type === "string" ? parsed.queryParams.type : null;

  if (!code) return { handled: false as const };

  if (path === "auth/callback" || path === "auth/reset") {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        handled: true as const,
        ok: false as const,
        path,
        type,
        error: error.message
      };
    }

    return {
      handled: true as const,
      ok: true as const,
      path,
      type,
      session: data.session
    };
  }

  return { handled: false as const };
}
