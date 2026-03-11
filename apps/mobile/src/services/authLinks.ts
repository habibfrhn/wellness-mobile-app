import * as Linking from "expo-linking";
import { supabase } from "./supabase";

type AuthLinkType = "signup" | "recovery" | "magiclink" | "email_change" | "unknown";

function resolveAuthPath(url: URL, parsedPath: string | null): "auth/callback" | "auth/reset" | null {
  const cleanParsedPath = (parsedPath ?? "").replace(/^\/+/, "").toLowerCase();
  const cleanUrlPath = url.pathname.replace(/^\/+/, "").toLowerCase();
  const flowParam = url.searchParams.get("auth_flow")?.toLowerCase();

  if (cleanParsedPath === "auth/callback" || cleanUrlPath === "auth/callback" || flowParam === "callback") {
    return "auth/callback";
  }

  if (cleanParsedPath === "auth/reset" || cleanUrlPath === "auth/reset" || flowParam === "reset") {
    return "auth/reset";
  }

  return null;
}

function mapLinkType(type: string | null): AuthLinkType {
  if (type === "signup" || type === "recovery" || type === "magiclink" || type === "email_change") {
    return type;
  }
  return "unknown";
}

/**
 * Handles Supabase auth links for web and native.
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
    const fromParsed = typeof parsed.queryParams?.[key] === "string" ? (parsed.queryParams?.[key] as string) : null;
    return fromParsed ?? null;
  };

  const path = resolveAuthPath(parsedUrl, parsed.path ?? null);
  const code = getParam("code");
  const tokenHash = getParam("token_hash");
  const token = getParam("token");
  const type = getParam("type");
  const email = getParam("email");
  const accessToken = getParam("access_token");
  const refreshToken = getParam("refresh_token");
  const linkType = mapLinkType(type);

  if (!path) return { handled: false as const };

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return {
        handled: true as const,
        ok: false as const,
        path,
        linkType,
        error: error.message,
      };
    }

    return {
      handled: true as const,
      ok: true as const,
      path,
      linkType,
      session: data.session,
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
        linkType,
        error: error.message,
      };
    }

    const resolvedPath = linkType === "recovery" ? "auth/reset" : path;

    return {
      handled: true as const,
      ok: true as const,
      path: resolvedPath,
      linkType,
      session: data.session,
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
        linkType,
        error: error.message,
      };
    }

    const resolvedPath = linkType === "recovery" ? "auth/reset" : path;

    return {
      handled: true as const,
      ok: true as const,
      path: resolvedPath,
      linkType,
      session: data.session,
    };
  }

  return {
    handled: true as const,
    ok: false as const,
    path,
    linkType,
    error: "tautan-tidak-valid",
  };
}
