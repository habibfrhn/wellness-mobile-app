import { Platform } from "react-native";

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
let analyticsFlushTimer: ReturnType<typeof setInterval> | null = null;
let analyticsListenersBound = false;
let flushInFlight = false;
let pendingQueue: TrackAnalyticsEventPayload[] = [];

const MAX_EVENT_PROPS_BYTES = 2048;
const MAX_STRING_PROP_LENGTH = 120;
const MAX_TAG_PROP_LENGTH = 64;
const AUDIO_ID_PROP_KEY = "audio_id";
const SESSION_MODE_PROP_KEY = "session_mode";
const MAX_EVENTS_PER_FLUSH = 25;
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 10_000;
const TRACK_FUNCTION_NAME = "track-analytics-event";

function logAnalyticsWarning(message: string, ...context: unknown[]) {
  if (__DEV__) {
    console.warn(`[analytics] ${message}`, ...context);
  }
}

function normalizeSessionMode(value: unknown) {
  if (value === "calm_mind" || value === "release_accept") {
    return value;
  }

  return null;
}

function normalizeTag(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized || normalized.length > MAX_TAG_PROP_LENGTH) {
    return null;
  }

  return normalized;
}

function normalizeAudioId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_STRING_PROP_LENGTH || !/^[a-z0-9_-]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function sanitizeEventProps(eventName: AnalyticsEventName, properties: Record<string, unknown>): Record<string, unknown> | null {
  const sanitized: Record<string, unknown> = {};

  if (eventName === "landing_page_view") {
    const surface = normalizeTag(properties.surface);
    if (surface) {
      sanitized.surface = surface;
    }

    return sanitized;
  }

  if (eventName === "landing_cta_click") {
    const cta = normalizeTag(properties.cta);
    if (cta) {
      sanitized.cta = cta;
    }

    return sanitized;
  }

  if (eventName === "signup_start" || eventName === "signup_complete") {
    const method = normalizeTag(properties.method);
    if (method) {
      sanitized.method = method;
    }

    return sanitized;
  }

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
    return sanitized;
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
    return sanitized;
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

type ParsedInvokeError = {
  status: number | null;
  code: string | null;
  message: string | null;
};


function canFallbackToLegacyEmptyProps(event: TrackAnalyticsEventPayload) {
  return (
    event.event_name === "landing_page_view" ||
    event.event_name === "landing_cta_click" ||
    event.event_name === "signup_start" ||
    event.event_name === "signup_complete"
  );
}

function toLegacyCompatiblePayload(event: TrackAnalyticsEventPayload): TrackAnalyticsEventPayload {
  if (!canFallbackToLegacyEmptyProps(event)) {
    return event;
  }

  return {
    ...event,
    event_props: {},
  };
}

function isValidEventProps(eventName: AnalyticsEventName, eventProps: Record<string, unknown>) {
  const keys = Object.keys(eventProps);

  if (eventName === "landing_page_view") {
    if (keys.length === 0) {
      return true;
    }

    return keys.length === 1 && keys[0] === "surface" && typeof eventProps.surface === "string";
  }

  if (eventName === "landing_cta_click") {
    if (keys.length === 0) {
      return true;
    }

    return keys.length === 1 && keys[0] === "cta" && typeof eventProps.cta === "string";
  }

  if (eventName === "signup_start" || eventName === "signup_complete") {
    if (keys.length === 0) {
      return true;
    }

    return keys.length === 1 && keys[0] === "method" && typeof eventProps.method === "string";
  }

  if (eventName === "home_sleep_cta_click") {
    return keys.length === 0;
  }

  if (eventName === "audio_click" || eventName === "audio_play" || eventName === "audio_complete" || eventName === "audio_abandon") {
    return keys.length === 1 && typeof eventProps.audio_id === "string" && eventProps.audio_id.trim().length > 0;
  }

  if (
    eventName === "tailored_session_select" ||
    eventName === "tailored_session_start" ||
    eventName === "tailored_session_complete" ||
    eventName === "tailored_session_dropoff"
  ) {
    return keys.length === 1 && (eventProps.session_mode === "calm_mind" || eventProps.session_mode === "release_accept");
  }

  return false;
}

function isValidTrackPayload(payload: TrackAnalyticsEventPayload) {
  const sessionId = payload.session_id.trim();
  if (sessionId.length < 8 || sessionId.length > 128) {
    return false;
  }

  if (!payload.event_props || typeof payload.event_props !== "object" || Array.isArray(payload.event_props)) {
    return false;
  }

  return isValidEventProps(payload.event_name, payload.event_props);
}

function getEventChunk() {
  if (pendingQueue.length === 0) {
    return [];
  }

  return pendingQueue.splice(0, MAX_EVENTS_PER_FLUSH);
}

async function parseInvokeError(error: unknown) {
  const context = (error as { context?: Response } | null)?.context;
  const status = typeof context?.status === "number" ? context.status : null;

  if (!context) {
    return { status, code: null as string | null, message: (error as { message?: string } | null)?.message ?? null };
  }

  try {
    const payload = (await context.clone().json()) as { code?: string; error?: string };
    return {
      status,
      code: typeof payload?.code === "string" ? payload.code : null,
      message: typeof payload?.error === "string" ? payload.error : (error as { message?: string } | null)?.message ?? null,
    };
  } catch {
    return { status, code: null as string | null, message: (error as { message?: string } | null)?.message ?? null };
  }
}

async function getCurrentAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

function getTrackFunctionUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/functions/v1/${TRACK_FUNCTION_NAME}`;
}

async function invokeTrackAnalyticsSingle(event: TrackAnalyticsEventPayload): Promise<ParsedInvokeError | null> {
  const accessToken = await getCurrentAccessToken();
  const { error } = await supabase.functions.invoke<{ ok: boolean; received: number }>(TRACK_FUNCTION_NAME, {
    body: event,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!error) {
    return null;
  }

  return parseInvokeError(error);
}

async function invokeTrackAnalyticsBatch(events: TrackAnalyticsEventPayload[]): Promise<ParsedInvokeError | null> {
  if (events.length === 0) {
    return null;
  }

  const accessToken = await getCurrentAccessToken();
  const { error } = await supabase.functions.invoke<{ ok: boolean; received: number }>(TRACK_FUNCTION_NAME, {
    body: { events },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (!error) {
    return null;
  }

  return parseInvokeError(error);
}


async function postAnalyticsPayload(events: TrackAnalyticsEventPayload[]): Promise<ParsedInvokeError | null> {
  const batchError = await invokeTrackAnalyticsBatch(events);
  if (!batchError) {
    return null;
  }

  if (batchError.status !== 400 && batchError.code !== "INVALID_PAYLOAD") {
    return batchError;
  }

  for (const event of events) {
    const singleError = await invokeTrackAnalyticsSingle(event);
    if (!singleError) {
      continue;
    }

    const canRetryWithLegacyProps =
      (singleError.status === 400 || singleError.code === "INVALID_PAYLOAD") && canFallbackToLegacyEmptyProps(event);

    if (canRetryWithLegacyProps) {
      const legacyPayload = toLegacyCompatiblePayload(event);
      const legacyError = await invokeTrackAnalyticsSingle(legacyPayload);
      if (!legacyError) {
        continue;
      }

      return {
        ...legacyError,
        message: legacyError.message ?? "legacy_payload_retry_failed",
      };
    }

    return singleError;
  }

  return null;
}

function trySendBeacon(events: TrackAnalyticsEventPayload[]) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const trackFunctionUrl = getTrackFunctionUrl();
  if (!trackFunctionUrl || typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
    return false;
  }

  try {
    const payload = JSON.stringify({ events });
    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon(trackFunctionUrl, blob);
  } catch {
    return false;
  }
}

function bindAnalyticsListeners() {
  if (analyticsListenersBound || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const flushNow = () => {
    void flushAnalyticsQueue();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushNow();
    }
  });

  window.addEventListener("pagehide", () => {
    if (pendingQueue.length === 0) {
      return;
    }

    const chunk = getEventChunk();
    if (chunk.length === 0) {
      return;
    }

    const validEvents = chunk.filter((event) => isValidTrackPayload(event));
    const beaconSent = trySendBeacon(validEvents);
    if (!beaconSent) {
      pendingQueue = [...validEvents, ...pendingQueue].slice(0, MAX_QUEUE_SIZE);
      flushNow();
    }
  });

  analyticsListenersBound = true;
}

function ensureFlushLoop() {
  if (analyticsFlushTimer) {
    return;
  }

  analyticsFlushTimer = setInterval(() => {
    void flushAnalyticsQueue();
  }, FLUSH_INTERVAL_MS);
}

async function flushAnalyticsQueue() {
  if (flushInFlight || pendingQueue.length === 0) {
    return;
  }

  flushInFlight = true;

  while (pendingQueue.length > 0) {
    const chunk = getEventChunk();
    const validEvents = chunk.filter((event) => isValidTrackPayload(event));
    const droppedCount = chunk.length - validEvents.length;
    if (droppedCount > 0) {
      logAnalyticsWarning("Dropped analytics events due invalid local payload", { droppedCount });
    }

    if (validEvents.length === 0) {
      continue;
    }

    const error = await postAnalyticsPayload(validEvents);
    if (!error) {
      continue;
    }

    if (error.status === 400 || error.code === "INVALID_PAYLOAD") {
      logAnalyticsWarning("Dropped analytics event batch due invalid payload", error);
      continue;
    }

    if (error.status === 401 || error.code === "INVALID_SESSION") {
      logAnalyticsWarning("Dropped analytics event batch due invalid session", error);
      continue;
    }

    pendingQueue = [...validEvents, ...pendingQueue].slice(0, MAX_QUEUE_SIZE);
    logAnalyticsWarning("Failed to flush analytics events", error.message ?? error.code ?? "unknown_error");
    flushInFlight = false;
    return;
  }

  flushInFlight = false;
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
  if (!sanitizedProps) {
    logAnalyticsWarning("Dropped analytics event due missing required props", eventName);
    return;
  }

  if (exceedsEventPropsLimit(sanitizedProps)) {
    logAnalyticsWarning("Dropped analytics event due to oversized payload", eventName);
    return;
  }

  const payload = {
    event_name: eventName,
    event_props: sanitizedProps,
    session_id: getAnalyticsSessionId(),
  };

  if (!isValidTrackPayload(payload)) {
    logAnalyticsWarning("Dropped analytics event due invalid payload shape", { eventName, sanitizedProps });
    return;
  }

  pendingQueue.push(payload);
  if (pendingQueue.length > MAX_QUEUE_SIZE) {
    pendingQueue = pendingQueue.slice(-MAX_QUEUE_SIZE);
  }

  bindAnalyticsListeners();
  ensureFlushLoop();

  if (pendingQueue.length >= MAX_EVENTS_PER_FLUSH) {
    await flushAnalyticsQueue();
  }
}
