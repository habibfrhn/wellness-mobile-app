export const WEB_MOBILE_BREAKPOINT = 640;
export const WEB_TABLET_BREAKPOINT = 1024;

export type WebViewport = "mobile" | "tablet" | "desktop";

export function getWebViewport(width: number): WebViewport {
  if (width <= WEB_MOBILE_BREAKPOINT) {
    return "mobile";
  }

  if (width <= WEB_TABLET_BREAKPOINT) {
    return "tablet";
  }

  return "desktop";
}
