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
  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));

  const getParam = (key: string) => {
    const fromSearch = parsedUrl.searchParams.get(key);
    if (fromSearch) return fromSearch;
    const fromHash = hashParams.get(key);
    if (fromHash) return fromHash;
    const fromParsed =
      typeof parsed.queryParams?.[key] === "string" ? (parsed.queryParams?.[key] as string) : null;
    return fromParsed ?? null;
  };

  const path = (parsed.path ?? "").toLowerCase();
  const code = getParam("code");
  const tokenHash = getParam("token_hash");
  const token = getParam("token");
  const type = getParam("type");
  const email = getParam("email");
  const accessToken = getParam("access_token");
  const refreshToken = getParam("refresh_token");

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

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

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
