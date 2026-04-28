const DEFAULT_LOCAL_WEB_ORIGIN = "http://localhost:8081";
const DEFAULT_PRODUCTION_WEB_ORIGINS = ["https://lumepo.com", "https://www.lumepo.com"];
const WEB_EXPO_ROUTE_PREFIX = "/--";

function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

function isLocalDevOrigin(origin: string) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function isAllowedWebOriginWithEnv(origin: string, allowedOriginsEnv: string | null | undefined) {
  const normalizedOrigin = normalizeOrigin(origin.toLowerCase());
  const configuredOrigins = (allowedOriginsEnv ?? "")
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean)
    .map((value: string) => normalizeOrigin(value.toLowerCase()));

  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(normalizedOrigin);
  }

  const defaultAllowedOrigins = [...DEFAULT_PRODUCTION_WEB_ORIGINS, DEFAULT_LOCAL_WEB_ORIGIN, "http://127.0.0.1:8081"].map(
    (value) => normalizeOrigin(value.toLowerCase())
  );

  if (defaultAllowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return isLocalDevOrigin(origin);
}

export function getWebAppOriginForContext(args: {
  nodeEnv: string | undefined;
  configuredOrigin: string | undefined;
  detectedOrigin: string | null;
  allowedOriginsEnv: string | undefined;
}) {
  const isProductionBuild = args.nodeEnv === "production";
  const configuredOrigin = normalizeOrigin(args.configuredOrigin?.trim() ?? "");

  if (args.detectedOrigin) {
    const normalizedDetectedOrigin = normalizeOrigin(args.detectedOrigin);
    if (isAllowedWebOriginWithEnv(normalizedDetectedOrigin, args.allowedOriginsEnv)) {
      return normalizedDetectedOrigin;
    }
  }

  if (configuredOrigin && isAllowedWebOriginWithEnv(configuredOrigin, args.allowedOriginsEnv)) {
    return configuredOrigin;
  }

  if (isProductionBuild) {
    return null;
  }

  return DEFAULT_LOCAL_WEB_ORIGIN;
}

export function getWebAuthPathFromPathname(pathname?: string | null): "callback" | "reset" | null {
  const value = (pathname ?? "").replace(/\/+$/, "") || "/";
  const normalizedPath = value.startsWith(WEB_EXPO_ROUTE_PREFIX)
    ? value.slice(WEB_EXPO_ROUTE_PREFIX.length) || "/"
    : value;

  if (normalizedPath === "/auth/callback") {
    return "callback";
  }

  if (normalizedPath === "/auth/reset") {
    return "reset";
  }

  return null;
}
