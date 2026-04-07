import { useEffect, useRef } from "react";

import { TURNSTILE_SITE_KEY } from "../../services/authCaptcha";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type Props = {
  onTokenChange: (token: string | null) => void;
  resetNonce: number;
};

const SCRIPT_ID = "cf-turnstile-script";

function loadTurnstileScript() {
  if (typeof document === "undefined") {
    return;
  }

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return;
  }

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function TurnstileCaptcha({ onTokenChange, resetNonce }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    onTokenChange(null);

    if (!TURNSTILE_SITE_KEY) {
      return;
    }

    loadTurnstileScript();

    let cancelled = false;
    const renderWhenReady = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => onTokenChange(token),
        "expired-callback": () => onTokenChange(null),
        "error-callback": () => onTokenChange(null),
      });
    };

    const interval = window.setInterval(renderWhenReady, 200);
    renderWhenReady();

    return () => {
      cancelled = true;
      window.clearInterval(interval);

      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onTokenChange]);

  useEffect(() => {
    if (!window.turnstile || !widgetIdRef.current) {
      return;
    }

    onTokenChange(null);
    window.turnstile.reset(widgetIdRef.current);
  }, [resetNonce, onTokenChange]);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div ref={containerRef} />
    </div>
  );
}
