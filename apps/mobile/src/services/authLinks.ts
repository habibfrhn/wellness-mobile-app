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
  const tokenHash =
    typeof parsed.queryParams?.token_hash === "string" ? parsed.queryParams.token_hash : null;
  const token =
    typeof parsed.queryParams?.token === "string" ? parsed.queryParams.token : null;
  const type =
    typeof parsed.queryParams?.type === "string" ? parsed.queryParams.type : null;
  const email =
    typeof parsed.queryParams?.email === "string" ? parsed.queryParams.email : null;

  const isAuthPath = path === "auth/callback" || path === "auth/reset";
  if (!isAuthPath) return { handled: false as const };

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        handled: true as const,
        ok: false as const,
        path,
        error: error.message
      };
    }

    return {
      handled: true as const,
      ok: true as const,
      path,
      session: data.session
    };
  }

  if (type && (tokenHash || (token && email))) {
    const params = tokenHash
      ? { type: type as any, token_hash: tokenHash }
      : { type: type as any, email: email as string, token: token as string };

    const { data, error } = await supabase.auth.verifyOtp(params);

    if (error) {
      return {
        handled: true as const,
        ok: false as const,
        path,
        error: error.message
      };
    }

    const resolvedPath = type === "recovery" ? "auth/reset" : path;

    return {
      handled: true as const,
      ok: true as const,
      path: resolvedPath,
      session: data.session
    };
  }

  return { handled: false as const };
}
