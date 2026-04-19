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
let analyticsIngestDisabledForSession = false;

const MAX_EVENT_PROPS_BYTES = 2048;
const MAX_STRING_PROP_LENGTH = 120;
const AUDIO_ID_PROP_KEY = "audio_id";
const SESSION_MODE_PROP_KEY = "session_mode";
const EVENT_PROP_ID_REGEX = /^[A-Za-z0-9_-]+$/;
const MAX_EVENTS_PER_FLUSH = 25;
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 10_000;
const USER_JWT_HEADER = "x-user-jwt";
const MAX_CONSECUTIVE_SERVER_FAILURES = 3;
const ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_ANALYTICS_ENABLED?.trim().toLowerCase() !== "false";
const ANALYTICS_BACKEND_FAILURE_KEY = "wellness.analytics.backendFailureAt";
const ANALYTICS_BACKEND_FAILURE_TTL_MS = 24 * 60 * 60 * 1000;
let consecutiveServerFailures = 0;

function logAnalyticsWarning(message: string, ...context: unknown[]) {
  if (__DEV__) {
    console.warn(message, ...context);
  }
}

function disableAnalyticsForSession(reason: string, details?: unknown) {
  analyticsIngestDisabledForSession = true;
  pendingQueue = [];

  if (analyticsFlushTimer) {
    clearInterval(analyticsFlushTimer);
    analyticsFlushTimer = null;
  }

  logAnalyticsWarning(reason, details);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ANALYTICS_BACKEND_FAILURE_KEY, String(Date.now()));
  }
}

function shouldKeepAnalyticsDisabledByStorage() {
  if (typeof window === "undefined") {
    return false;
  }

  const rawValue = window.localStorage.getItem(ANALYTICS_BACKEND_FAILURE_KEY);
  const timestamp = Number(rawValue);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return false;
  }

  if (Date.now() - timestamp > ANALYTICS_BACKEND_FAILURE_TTL_MS) {
    window.localStorage.removeItem(ANALYTICS_BACKEND_FAILURE_KEY);
    return false;
  }

  return true;
}

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

function sanitizeEventProps(
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

function isValidTrackPayload(payload: TrackAnalyticsEventPayload) {
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

function getEventChunk() {
  if (pendingQueue.length === 0) {
    return [];
  }

  return pendingQueue.splice(0, MAX_EVENTS_PER_FLUSH);
}

async function getUserAccessTokenForAnalytics() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    return null;
  }

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs && expiresAtMs <= Date.now() + 15_000) {
    return null;
  }

  return session.access_token;
}

async function postAnalyticsEvents(events: TrackAnalyticsEventPayload[]) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing analytics function configuration");
  }

  const sendRequest = async (userJwt: string | null) => {
    try {
      return await fetch(`${supabaseUrl}/functions/v1/track-analytics-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          ...(userJwt ? { [USER_JWT_HEADER]: userJwt } : {}),
        },
        body: JSON.stringify(events.length === 1 ? events[0] : { events }),
      });
    } catch (requestError) {
      return {
        ok: false,
        status: 0,
        json: async () => ({
          error: requestError instanceof Error ? requestError.message : "Network request failed",
          code: "NETWORK_ERROR",
        }),
      } as Pick<Response, "ok" | "status" | "json">;
    }
  };

  const accessToken = await getUserAccessTokenForAnalytics();
  let response = await sendRequest(accessToken);

  if (!response.ok) {
    let payload: { error?: string; code?: string } | null = null;
    try {
      payload = (await response.json()) as { error?: string; code?: string };
    } catch {
      payload = null;
    }

    const errorPayload = {
      status: response.status,
      code: payload?.code ?? null,
      message: payload?.error ?? null,
    };

    if (accessToken && (errorPayload.status === 401 || errorPayload.code === "INVALID_SESSION")) {
      response = await sendRequest(null);
      if (response.ok) {
        return null;
      }

      let fallbackPayload: { error?: string; code?: string } | null = null;
      try {
        fallbackPayload = (await response.json()) as { error?: string; code?: string };
      } catch {
        fallbackPayload = null;
      }

      return {
        status: response.status,
        code: fallbackPayload?.code ?? null,
        message: fallbackPayload?.error ?? null,
      };
    }

    return errorPayload;
  }

  return null;
}

function bindAnalyticsListeners() {
  if (analyticsListenersBound || typeof window === "undefined") {
    return;
  }

  const flushNow = () => {
    void flushAnalyticsQueue();
  };

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushNow();
    }
  });
  window.addEventListener("beforeunload", flushNow);
  analyticsListenersBound = true;
}

function ensureFlushLoop() {
  if (analyticsIngestDisabledForSession) {
    return;
  }

  if (analyticsFlushTimer) {
    return;
  }

  analyticsFlushTimer = setInterval(() => {
    void flushAnalyticsQueue();
  }, FLUSH_INTERVAL_MS);
}

async function flushAnalyticsQueue() {
  if (analyticsIngestDisabledForSession || flushInFlight || pendingQueue.length === 0) {
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

    const requestError = await postAnalyticsEvents(validEvents);
    if (requestError) {
      if (requestError.code === "RATE_LIMIT_FAILED") {
        disableAnalyticsForSession("Analytics ingest disabled due rate-limit backend failure", {
          droppedEvents: validEvents.length,
          ...requestError,
        });
        continue;
      }

      if (requestError.status === 400 || requestError.code === "INVALID_PAYLOAD") {
        logAnalyticsWarning("Dropped analytics event batch due invalid payload", requestError);
        continue;
      }

      if (requestError.status === 401 || requestError.code === "INVALID_SESSION") {
        logAnalyticsWarning("Dropped analytics event batch due invalid session", requestError);
        continue;
      }

      if ((requestError.status ?? 0) >= 500) {
        consecutiveServerFailures += 1;
        pendingQueue = [...validEvents, ...pendingQueue].slice(0, MAX_QUEUE_SIZE);
        if (consecutiveServerFailures >= MAX_CONSECUTIVE_SERVER_FAILURES) {
          disableAnalyticsForSession("Analytics ingest disabled for current session after repeated server failures", {
            consecutiveServerFailures,
            ...requestError,
          });
          continue;
        }

        logAnalyticsWarning("Analytics ingest server failure; will retry on next flush", {
          consecutiveServerFailures,
          ...requestError,
        });
        flushInFlight = false;
        return;
      }

      pendingQueue = [...validEvents, ...pendingQueue].slice(0, MAX_QUEUE_SIZE);
      logAnalyticsWarning("Failed to flush analytics events", requestError.message ?? "unknown request error");
      flushInFlight = false;
      return;
    }

    consecutiveServerFailures = 0;
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
  if (!ANALYTICS_ENABLED) {
    return;
  }

  if (shouldKeepAnalyticsDisabledByStorage()) {
    analyticsIngestDisabledForSession = true;
    return;
  }

  if (analyticsIngestDisabledForSession) {
    return;
  }

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
    logAnalyticsWarning("Dropped analytics event due invalid payload shape", eventName);
    return;
  }

  pendingQueue.push(payload);
  if (pendingQueue.length > MAX_QUEUE_SIZE) {
    pendingQueue = pendingQueue.slice(-MAX_QUEUE_SIZE);
  }

  bindAnalyticsListeners();
  ensureFlushLoop();

  if (pendingQueue.length >= MAX_EVENTS_PER_FLUSH) {
    void flushAnalyticsQueue();
  }
}
