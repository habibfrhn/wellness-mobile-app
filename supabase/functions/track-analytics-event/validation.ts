export type AnalyticsEventName =
  | "landing_page_view"
  | "landing_cta_click"
  | "home_sleep_cta_click"
  | "audio_click"
  | "signup_start"
  | "signup_complete"
  | "audio_play"
  | "audio_complete"
  | "audio_abandon"
  | "tailored_session_select"
  | "tailored_session_start"
  | "tailored_session_complete"
  | "tailored_session_dropoff";

export type TrackAnalyticsEventBody = {
  event_name: AnalyticsEventName;
  event_props: Record<string, unknown>;
  session_id: string;
};

export type TrackAnalyticsBatchBody = {
  events: TrackAnalyticsEventBody[];
};

const EVENT_PROP_ID_REGEX = /^[A-Za-z0-9_-]+$/;

export const EVENT_NAMES: AnalyticsEventName[] = [
  "landing_page_view",
  "landing_cta_click",
  "home_sleep_cta_click",
  "audio_click",
  "signup_start",
  "signup_complete",
  "audio_play",
  "audio_complete",
  "audio_abandon",
  "tailored_session_select",
  "tailored_session_start",
  "tailored_session_complete",
  "tailored_session_dropoff",
];

export function isValidPayload(value: unknown): value is TrackAnalyticsEventBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<TrackAnalyticsEventBody>;
  if (!EVENT_NAMES.includes(payload.event_name as AnalyticsEventName)) {
    return false;
  }

  if (typeof payload.session_id !== "string") {
    return false;
  }

  const normalizedSessionId = payload.session_id.trim();
  if (normalizedSessionId.length < 8 || normalizedSessionId.length > 128) {
    return false;
  }

  if (!payload.event_props || typeof payload.event_props !== "object" || Array.isArray(payload.event_props)) {
    return false;
  }

  const eventProps = payload.event_props as Record<string, unknown>;
  const eventPropKeys = Object.keys(eventProps);
  if (eventPropKeys.length > 1) {
    return false;
  }

  if (
    payload.event_name === "audio_click" ||
    payload.event_name === "audio_play" ||
    payload.event_name === "audio_complete" ||
    payload.event_name === "audio_abandon"
  ) {
    return (
      typeof eventProps.audio_id === "string" &&
      eventProps.audio_id.trim().length > 0 &&
      eventProps.audio_id.trim().length <= 120 &&
      EVENT_PROP_ID_REGEX.test(eventProps.audio_id.trim())
    );
  }

  if (payload.event_name === "tailored_session_select") {
    return eventProps.session_mode === "calm_mind" || eventProps.session_mode === "release_accept";
  }

  if (
    payload.event_name === "tailored_session_start" ||
    payload.event_name === "tailored_session_complete" ||
    payload.event_name === "tailored_session_dropoff"
  ) {
    if (eventPropKeys.length === 0) {
      return true;
    }

    return eventProps.session_mode === "calm_mind" || eventProps.session_mode === "release_accept";
  }

  return Object.keys(eventProps).length === 0;
}

export function parsePayloadEvents(value: unknown, maxEventsPerRequest: number): TrackAnalyticsEventBody[] | null {
  if (isValidPayload(value)) {
    return [value];
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const batch = value as Partial<TrackAnalyticsBatchBody>;
  if (!Array.isArray(batch.events) || batch.events.length === 0 || batch.events.length > maxEventsPerRequest) {
    return null;
  }

  if (!batch.events.every((item) => isValidPayload(item))) {
    return null;
  }

  return batch.events;
}

const REQUIRED_WEB_ORIGINS = ["https://www.lumepo.com", "https://lumepo.com"];
const LOCAL_DEV_ORIGINS = ["http://localhost:8081", "http://127.0.0.1:8081"];
const VERCEL_PREVIEW_ORIGIN_REGEX = /^https:\/\/wellness-mobile-[a-z0-9-]+\.vercel\.app$/i;

export function getAllowedCorsOrigin(origin: string | null, allowedOriginsRaw: string): string | null {
  if (!origin) {
    return null;
  }

  const normalizedOrigin = origin.trim().toLowerCase();

  const configuredAllowedOrigins = allowedOriginsRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  const expandedAllowedOrigins = Array.from(
    new Set([...configuredAllowedOrigins, ...REQUIRED_WEB_ORIGINS, ...LOCAL_DEV_ORIGINS])
  );

  if (expandedAllowedOrigins.includes(normalizedOrigin)) {
    return origin;
  }

  if (VERCEL_PREVIEW_ORIGIN_REGEX.test(origin)) {
    return origin;
  }

  return null;
}
