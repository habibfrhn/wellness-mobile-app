import { Platform } from "react-native";

const DEFAULT_LOCAL_WEB_ORIGIN = "http://localhost:8081";
const DEFAULT_PRODUCTION_WEB_ORIGINS = ["https://lumepo.com", "https://www.lumepo.com"];

export const WEB_AUTH_CALLBACK_PATH = "/auth/callback";
export const WEB_AUTH_RESET_PATH = "/auth/reset";
const WEB_EXPO_ROUTE_PREFIX = "/--";

function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

function parseConfiguredOrigins() {
  return (process.env.EXPO_PUBLIC_WEB_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean)
    .map((value: string) => normalizeOrigin(value.toLowerCase()));
}

function matchesWildcardOrigin(pattern: string, normalizedOrigin: string) {
  if (!pattern.includes("*")) {
    return false;
  }

  const [protocolPart, hostPart] = pattern.split("://");
  if (!protocolPart || !hostPart) {
    return false;
  }

  if (!hostPart.startsWith("*.")) {
    return false;
  }

  const wildcardSuffix = hostPart.slice(1); // ".example.com"
  if (!wildcardSuffix) {
    return false;
  }

  return normalizedOrigin.startsWith(`${protocolPart}://`) && normalizedOrigin.endsWith(wildcardSuffix);
}

function isLocalDevOrigin(origin: string) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function isAllowedWebOrigin(origin: string) {
  const normalizedOrigin = normalizeOrigin(origin.toLowerCase());
  const configuredOrigins = parseConfiguredOrigins();

  if (configuredOrigins.length > 0) {
    if (configuredOrigins.includes(normalizedOrigin)) {
      return true;
    }

    return configuredOrigins.some((pattern: string) => matchesWildcardOrigin(pattern, normalizedOrigin));
  }

  const defaultAllowedOrigins = [...DEFAULT_PRODUCTION_WEB_ORIGINS, DEFAULT_LOCAL_WEB_ORIGIN, "http://127.0.0.1:8081"].map(
    (value) => normalizeOrigin(value.toLowerCase())
  );

  if (defaultAllowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return isLocalDevOrigin(origin);
}

export function getWebAppOrigin() {
  const isProductionBuild = process.env.NODE_ENV === "production";
  const configuredOrigin = normalizeOrigin(process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim() ?? "");

  if (typeof window !== "undefined" && window.location?.origin) {
    const detectedOrigin = normalizeOrigin(window.location.origin);
    if (isAllowedWebOrigin(detectedOrigin)) {
      return detectedOrigin;
    }

    const detectedProtocol = window.location.protocol.toLowerCase();
    if (detectedProtocol === "https:" || isLocalDevOrigin(detectedOrigin)) {
      return detectedOrigin;
    }
  }

  if (configuredOrigin && isAllowedWebOrigin(configuredOrigin)) {
    return configuredOrigin;
  }

  if (isProductionBuild) {
    return null;
  }

  return DEFAULT_LOCAL_WEB_ORIGIN;
}

export function buildAuthRedirectPath(flow: "callback" | "reset") {
  if (Platform.OS !== "web") {
    return `wellnessapp://auth/${flow}`;
  }

  const origin = getWebAppOrigin();
  if (!origin) {
    return "";
  }

  return `${origin}${flow === "callback" ? WEB_AUTH_CALLBACK_PATH : WEB_AUTH_RESET_PATH}`;
}

export function getWebAuthPath(pathname?: string | null): "callback" | "reset" | null {
  const value = (pathname ?? "").replace(/\/+$/, "") || "/";
  const normalizedPath = value.startsWith(WEB_EXPO_ROUTE_PREFIX)
    ? value.slice(WEB_EXPO_ROUTE_PREFIX.length) || "/"
    : value;

  if (normalizedPath === WEB_AUTH_CALLBACK_PATH) {
    return "callback";
  }

  if (normalizedPath === WEB_AUTH_RESET_PATH) {
    return "reset";
  }

  return null;
}

export function replaceWebUrl(pathname = "/") {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  window.history.replaceState({}, "", pathname);
}
