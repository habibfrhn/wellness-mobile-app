import { supabase } from "./supabase";

export type AnalyticsEventName =
  | "landing_page_view"
  | "landing_cta_click"
  | "signup_start"
  | "signup_complete"
  | "audio_play"
  | "audio_complete"
  | "audio_abandon"
  | "tailored_session_start"
  | "tailored_session_complete"
  | "tailored_session_dropoff";

let inMemorySessionId: string | null = null;

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
  const payload = {
    event_name: eventName,
    event_props: properties,
    session_id: getAnalyticsSessionId(),
    occurred_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("analytics_events").insert(payload);
  if (error) {
    console.warn("Failed to track analytics event", eventName, error.message);
  }
}
