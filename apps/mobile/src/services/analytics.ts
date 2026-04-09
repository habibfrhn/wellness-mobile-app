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

type TrackAnalyticsEventPayload = {
  event_name: AnalyticsEventName;
  event_props: Record<string, unknown>;
  session_id: string;
};

type TrackAnalyticsBatchPayload = {
  events: TrackAnalyticsEventPayload[];
};

type AnalyticsInvokeFailure = {
  status: number | null;
  code: string | null;
  message: string | null;
};

const MAX_EVENT_PROPS_BYTES = 2048;
const MAX_STRING_PROP_LENGTH = 120;
const AUDIO_ID_PROP_KEY = "audio_id";
const SESSION_MODE_PROP_KEY = "session_mode";
const MAX_EVENTS_PER_FLUSH = 25;
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 10_000;
const SESSION_REFRESH_LEEWAY_SECONDS = 30;

const TRACK_ANALYTICS_FUNCTION = "track-analytics-event";
const ANALYTICS_API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${TRACK_ANALYTICS_FUNCTION}`
  : null;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

let inMemorySessionId: string | null = null;
let analyticsFlushTimer: ReturnType<typeof setInterval> | null = null;
let analyticsListenersBound = false;
let flushInFlight = false;
let pendingQueue: TrackAnalyticsEventPayload[] = [];

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
    return payload.event_props.session_mode === "calm_mind" || payload.event_props.session_mode === "release_accept";
  }

  return Object.keys(payload.event_props).length === 0;
}

function getEventChunk() {
  if (pendingQueue.length === 0) {
    return [];
  }

  return pendingQueue.splice(0, MAX_EVENTS_PER_FLUSH);
}

async function ensureFreshAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logAnalyticsWarning("Failed to read auth session for analytics flush", error.message);
    return null;
  }

  const session = data.session;
  if (!session?.access_token) {
    return null;
  }

  const expiresAt = typeof session.expires_at === "number" ? session.expires_at : null;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (expiresAt && expiresAt - nowSeconds <= SESSION_REFRESH_LEEWAY_SECONDS) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      logAnalyticsWarning("Failed to refresh auth session before analytics flush", refreshError?.message ?? null);
      return null;
    }

    return refreshed.session.access_token;
  }

  return session.access_token;
}

async function postAnalyticsPayload(payload: TrackAnalyticsBatchPayload | TrackAnalyticsEventPayload) {
  if (!ANALYTICS_API_URL || !SUPABASE_ANON_KEY) {
    return {
      status: 500,
      code: "CLIENT_MISCONFIGURATION",
      message: "Missing Supabase analytics endpoint configuration",
    } satisfies AnalyticsInvokeFailure;
  }

  const token = await ensureFreshAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(ANALYTICS_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return null;
    }

    let code: string | null = null;
    let message: string | null = null;

    try {
      const errorPayload = (await response.json()) as { code?: string; error?: string };
      code = typeof errorPayload.code === "string" ? errorPayload.code : null;
      message = typeof errorPayload.error === "string" ? errorPayload.error : null;
    } catch {
      message = response.statusText;
    }

    return {
      status: response.status,
      code,
      message,
    } satisfies AnalyticsInvokeFailure;
  } catch (networkError) {
    return {
      status: null,
      code: "NETWORK_ERROR",
      message: networkError instanceof Error ? networkError.message : "Network request failed",
    } satisfies AnalyticsInvokeFailure;
  }
}



type FlushSingleResult = "all_handled" | "requeue_remaining";

async function flushEventsIndividually(events: TrackAnalyticsEventPayload[]): Promise<FlushSingleResult> {
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const failure = await postAnalyticsPayload(event);
    if (!failure) {
      continue;
    }

    if (failure.status === 400 || failure.code === "INVALID_PAYLOAD") {
      logAnalyticsWarning("Dropped analytics event due invalid payload", {
        eventName: event.event_name,
        sessionId: event.session_id,
        failure,
      });
      continue;
    }

    pendingQueue = [...events.slice(index), ...pendingQueue].slice(0, MAX_QUEUE_SIZE);

    if (failure.status === 401 || failure.code === "INVALID_SESSION") {
      logAnalyticsWarning("Analytics flush blocked by invalid auth session", failure);
      return "requeue_remaining";
    }

    logAnalyticsWarning("Failed to flush analytics events", failure);
    return "requeue_remaining";
  }

  return "all_handled";
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

    const failure = await postAnalyticsPayload({ events: validEvents });
    if (!failure) {
      continue;
    }

    if (failure.status === 400 || failure.code === "INVALID_PAYLOAD") {
      if (validEvents.length === 1) {
        logAnalyticsWarning("Dropped analytics event due invalid payload", {
          eventName: validEvents[0].event_name,
          sessionId: validEvents[0].session_id,
          failure,
        });
        continue;
      }

      logAnalyticsWarning("Analytics batch rejected; retrying events one-by-one", {
        failure,
        batchSize: validEvents.length,
      });

      const singleResult = await flushEventsIndividually(validEvents);
      if (singleResult === "requeue_remaining") {
        break;
      }
      continue;
    }

    pendingQueue = [...validEvents, ...pendingQueue].slice(0, MAX_QUEUE_SIZE);

    if (failure.status === 401 || failure.code === "INVALID_SESSION") {
      logAnalyticsWarning("Analytics flush blocked by invalid auth session", failure);
      break;
    }

    logAnalyticsWarning("Failed to flush analytics events", failure);
    break;
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
    await flushAnalyticsQueue();
  }
}
