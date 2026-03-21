import { spacing } from "../theme/tokens";

export const WEB_MOBILE_BREAKPOINT = 640;
export const WEB_TABLET_BREAKPOINT = 1024;
export const WEB_SECTION_CONTENT_INSET = spacing.sm;

export type WebViewport = "mobile" | "tablet" | "desktop";

type WebPageWidths = {
  mobile: number;
  tablet: number;
  desktop: number;
};

export function getWebViewport(width: number): WebViewport {
  if (width <= WEB_MOBILE_BREAKPOINT) {
    return "mobile";
  }

  if (width <= WEB_TABLET_BREAKPOINT) {
    return "tablet";
  }

  return "desktop";
}

export function getWebPageHorizontalPadding(viewport: WebViewport) {
  if (viewport === "desktop") {
    return spacing.xl;
  }

  if (viewport === "tablet") {
    return spacing.lg;
  }

  return spacing.md;
}

export function getWebPageMaxWidth(viewport: WebViewport, widths: WebPageWidths) {
  if (viewport === "desktop") {
    return widths.desktop;
  }

  if (viewport === "tablet") {
    return widths.tablet;
  }

  return widths.mobile;
}

export function getWebPageContainerStyle(viewport: WebViewport, widths: WebPageWidths) {
  return {
    width: "100%" as const,
    alignSelf: "center" as const,
    maxWidth: getWebPageMaxWidth(viewport, widths),
    paddingHorizontal: getWebPageHorizontalPadding(viewport),
  };
}
