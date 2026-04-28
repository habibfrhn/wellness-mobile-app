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

const MAX_STRING_PROP_LENGTH = 120;
const AUDIO_ID_PROP_KEY = "audio_id";
const SESSION_MODE_PROP_KEY = "session_mode";
const EVENT_PROP_ID_REGEX = /^[A-Za-z0-9_-]+$/;

export type TrackAnalyticsEventPayload = {
  event_name: AnalyticsEventName;
  event_props: Record<string, unknown>;
  session_id: string;
};

function normalizeSessionMode(value: unknown) {
  if (value === "calm_mind" || value === "release_accept") {
    return value;
  }

  return null;
}

function normalizeAudioId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_STRING_PROP_LENGTH || !EVENT_PROP_ID_REGEX.test(normalized)) {
    return null;
  }

  return normalized;
}

export function sanitizeEventProps(
  eventName: AnalyticsEventName,
  properties: Record<string, unknown>
): Record<string, unknown> | null {
  const sanitized: Record<string, unknown> = {};

  if (
    eventName === "audio_click" ||
    eventName === "audio_play" ||
    eventName === "audio_complete" ||
    eventName === "audio_abandon"
  ) {
    const normalizedAudioId = normalizeAudioId(properties[AUDIO_ID_PROP_KEY]);
    if (!normalizedAudioId) {
      return null;
    }

    sanitized[AUDIO_ID_PROP_KEY] = normalizedAudioId;
  }

  if (
    eventName === "tailored_session_select" ||
    eventName === "tailored_session_start" ||
    eventName === "tailored_session_complete" ||
    eventName === "tailored_session_dropoff"
  ) {
    const normalizedSessionMode = normalizeSessionMode(properties[SESSION_MODE_PROP_KEY]);
    if (!normalizedSessionMode) {
      return null;
    }

    sanitized[SESSION_MODE_PROP_KEY] = normalizedSessionMode;
  }

  return sanitized;
}

export function isValidTrackPayload(payload: TrackAnalyticsEventPayload) {
  const sessionId = payload.session_id.trim();
  if (sessionId.length < 8 || sessionId.length > 128) {
    return false;
  }

  if (!payload.event_props || typeof payload.event_props !== "object" || Array.isArray(payload.event_props)) {
    return false;
  }

  if (
    payload.event_name === "audio_click" ||
    payload.event_name === "audio_play" ||
    payload.event_name === "audio_complete" ||
    payload.event_name === "audio_abandon"
  ) {
    return typeof payload.event_props.audio_id === "string" && payload.event_props.audio_id.trim().length > 0;
  }

  if (
    payload.event_name === "tailored_session_select" ||
    payload.event_name === "tailored_session_start" ||
    payload.event_name === "tailored_session_complete" ||
    payload.event_name === "tailored_session_dropoff"
  ) {
    return (
      payload.event_props.session_mode === "calm_mind" ||
      payload.event_props.session_mode === "release_accept"
    );
  }

  return Object.keys(payload.event_props).length === 0;
}
