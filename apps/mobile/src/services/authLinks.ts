import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { isAllowedWebOrigin } from "./webAuth";
import { logAuthDebugEvent } from "./authDebug";

type AuthLinkType = "signup" | "recovery" | "magiclink" | "email_change" | "unknown";

function normalizeAuthPath(path: string | null | undefined) {
  const cleanPath = (path ?? "").replace(/^\/+/, "").toLowerCase();
  return cleanPath.startsWith("--/") ? cleanPath.slice(3) : cleanPath;
}

function resolveAuthPath(url: URL, parsedPath: string | null): "auth/callback" | "auth/reset" | null {
  const cleanParsedPath = normalizeAuthPath(parsedPath);
  const cleanUrlPath = normalizeAuthPath(url.pathname);
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

export function isPotentialAuthLink(url: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  const pathname = normalizeAuthPath(parsedUrl.pathname);
  if (pathname === "auth/callback" || pathname === "auth/reset") {
    return true;
  }

  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const hasParam = (key: string) => Boolean(parsedUrl.searchParams.get(key) || hashParams.get(key));
  return (
    hasParam("auth_flow") ||
    hasParam("code") ||
    hasParam("type") ||
    hasParam("access_token") ||
    hasParam("refresh_token") ||
    hasParam("token_hash") ||
    hasParam("token")
  );
}

function isTrustedAuthLinkUrl(parsedUrl: URL) {
  if (Platform.OS !== "web") {
    return true;
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  if (protocol !== "https:" && protocol !== "http:") {
    return false;
  }

  if (!isAllowedWebOrigin(parsedUrl.origin)) {
    logAuthDebugEvent("warn", "oauth_callback_untrusted_origin", {
      origin: parsedUrl.origin,
    });
    return false;
  }

  return true;
}

/**
 * Handles Supabase auth links for web and native.
 */
export async function handleAuthLink(url: string) {
  logAuthDebugEvent("info", "oauth_callback_received", {
    url,
  });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    logAuthDebugEvent("warn", "oauth_callback_invalid_url", { url });
    return { handled: false as const };
  }

  if (!isTrustedAuthLinkUrl(parsedUrl)) {
    logAuthDebugEvent("warn", "oauth_callback_rejected", {
      origin: parsedUrl.origin,
      pathname: parsedUrl.pathname,
    });
    return { handled: false as const };
  }

  const parsed = Linking.parse(url);
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
  const inferredPath =
    path ?? (linkType === "recovery" ? "auth/reset" : linkType !== "unknown" ? "auth/callback" : null);

  if (!inferredPath) return { handled: false as const };

  if (code) {
    logAuthDebugEvent("info", "oauth_callback_exchange_code_start", {
      inferredPath,
      linkType,
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logAuthDebugEvent("error", "oauth_callback_exchange_code_failed", {
        inferredPath,
        linkType,
        error: error.message,
      });
      return {
        handled: true as const,
        ok: false as const,
        path: inferredPath,
        linkType,
        error: error.message,
      };
    }

    return {
      handled: true as const,
      ok: true as const,
      path: inferredPath,
      linkType,
      session: data.session,
    };
  }

  if (accessToken && refreshToken) {
    logAuthDebugEvent("info", "oauth_callback_set_session_start", {
      inferredPath,
      linkType,
    });
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      logAuthDebugEvent("error", "oauth_callback_set_session_failed", {
        inferredPath,
        linkType,
        error: error.message,
      });
      return {
        handled: true as const,
        ok: false as const,
        path: inferredPath,
        linkType,
        error: error.message,
      };
    }

    const resolvedPath = linkType === "recovery" ? "auth/reset" : inferredPath;

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
      logAuthDebugEvent("error", "oauth_callback_verify_otp_failed", {
        inferredPath,
        linkType,
        type,
        error: error.message,
      });
      return {
        handled: true as const,
        ok: false as const,
        path: inferredPath,
        linkType,
        error: error.message,
      };
    }

    const resolvedPath = linkType === "recovery" ? "auth/reset" : inferredPath;

    return {
      handled: true as const,
      ok: true as const,
      path: resolvedPath,
      linkType,
      session: data.session,
    };
  }

  logAuthDebugEvent("warn", "oauth_callback_missing_expected_params", {
    inferredPath,
    linkType,
    hasCode: Boolean(code),
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    hasTokenHash: Boolean(tokenHash),
  });

  return {
    handled: true as const,
    ok: false as const,
    path: inferredPath,
    linkType,
    error: "tautan-tidak-valid",
  };
}
