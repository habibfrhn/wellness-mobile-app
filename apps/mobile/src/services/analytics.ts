import { supabase } from "./supabase";

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

let inMemorySessionId: string | null = null;
const MAX_EVENT_PROPS_BYTES = 2048;
const MAX_STRING_PROP_LENGTH = 120;
const AUDIO_ID_PROP_KEY = "audio_id";
const SESSION_MODE_PROP_KEY = "session_mode";

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
  if (!normalized || normalized.length > MAX_STRING_PROP_LENGTH) {
    return null;
  }

  return normalized;
}

function sanitizeEventProps(eventName: AnalyticsEventName, properties: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};

  if (
    eventName === "audio_click" ||
    eventName === "audio_play" ||
    eventName === "audio_complete" ||
    eventName === "audio_abandon"
  ) {
    const normalizedAudioId = normalizeAudioId(properties[AUDIO_ID_PROP_KEY]);
    if (normalizedAudioId) {
      sanitized[AUDIO_ID_PROP_KEY] = normalizedAudioId;
    }
  }

  if (
    eventName === "tailored_session_select" ||
    eventName === "tailored_session_start" ||
    eventName === "tailored_session_complete" ||
    eventName === "tailored_session_dropoff"
  ) {
    const normalizedSessionMode = normalizeSessionMode(properties[SESSION_MODE_PROP_KEY]);
    if (normalizedSessionMode) {
      sanitized[SESSION_MODE_PROP_KEY] = normalizedSessionMode;
    }
  }

  return sanitized;
}

function exceedsEventPropsLimit(value: Record<string, unknown>) {
  try {
    return JSON.stringify(value).length > MAX_EVENT_PROPS_BYTES;
  } catch {
    return true;
  }
}

type TrackAnalyticsEventPayload = {
  event_name: AnalyticsEventName;
  event_props: Record<string, unknown>;
  session_id: string;
};

async function invokeTrackAnalyticsEvent(payload: TrackAnalyticsEventPayload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const { error } = await supabase.functions.invoke<{ ok: boolean }>("track-analytics-event", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: payload,
  });

  return error;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsSessionId() {
  if (!inMemorySessionId) {
    inMemorySessionId = createSessionId();
  }

  return inMemorySessionId;
}

export async function trackEvent(eventName: AnalyticsEventName, properties: Record<string, unknown> = {}) {
  const sanitizedProps = sanitizeEventProps(eventName, properties);
  if (exceedsEventPropsLimit(sanitizedProps)) {
    console.warn("Dropped analytics event due to oversized payload", eventName);
    return;
  }

  const payload = {
    event_name: eventName,
    event_props: sanitizedProps,
    session_id: getAnalyticsSessionId(),
  };

  const error = await invokeTrackAnalyticsEvent(payload);
  if (error) {
    console.warn("Failed to track analytics event", eventName, error.message);
  }
}
