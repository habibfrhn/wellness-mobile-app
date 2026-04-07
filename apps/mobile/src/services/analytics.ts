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
let cachedAccessToken: string | null = null;
let accessTokenRefreshAtMs = 0;
let pendingQueue: TrackAnalyticsEventPayload[] = [];

const MAX_EVENT_PROPS_BYTES = 2048;
const MAX_STRING_PROP_LENGTH = 120;
const AUDIO_ID_PROP_KEY = "audio_id";
const SESSION_MODE_PROP_KEY = "session_mode";
const MAX_EVENTS_PER_FLUSH = 25;
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 10_000;
const TOKEN_CACHE_FALLBACK_MS = 30_000;

function logAnalyticsWarning(message: string, ...context: unknown[]) {
  if (__DEV__) {
    console.warn(message, ...context);
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

async function getCachedAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < accessTokenRefreshAtMs) {
    return cachedAccessToken;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  cachedAccessToken = session?.access_token ?? null;
  if (session?.expires_at) {
    accessTokenRefreshAtMs = Math.max(now, session.expires_at * 1000 - 60_000);
  } else {
    accessTokenRefreshAtMs = now + TOKEN_CACHE_FALLBACK_MS;
  }

  return cachedAccessToken;
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

async function invokeTrackAnalyticsSingleEvent(event: TrackAnalyticsEventPayload, includeAuth = true) {
  const accessToken = await getCachedAccessToken();
  const headers = includeAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  const { error } = await supabase.functions.invoke<{ ok: boolean }>("track-analytics-event", {
    headers,
    body: event,
  });

  return error;
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

    for (let index = 0; index < validEvents.length; index += 1) {
      const event = validEvents[index];
      let error = await invokeTrackAnalyticsSingleEvent(event);
      if (error) {
        const details = await parseInvokeError(error);

        if (details.status === 401 || details.code === "INVALID_SESSION") {
          cachedAccessToken = null;
          accessTokenRefreshAtMs = 0;

          error = await invokeTrackAnalyticsSingleEvent(event, false);
          if (!error) {
            continue;
          }
        }

        const finalDetails = await parseInvokeError(error);

        if (finalDetails.status === 400 || finalDetails.code === "INVALID_PAYLOAD") {
          logAnalyticsWarning("Dropped analytics event due invalid payload", finalDetails);
          continue;
        }

        if (finalDetails.status === 401 || finalDetails.code === "INVALID_SESSION") {
          logAnalyticsWarning("Dropped analytics event due invalid session", finalDetails);
          continue;
        }

        pendingQueue = [...validEvents.slice(index), ...pendingQueue].slice(0, MAX_QUEUE_SIZE);
        logAnalyticsWarning("Failed to flush analytics events", finalDetails.message ?? error.message);
        flushInFlight = false;
        return;
      }
    }
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
