import { supabase } from "./supabase";

export type AdminAnalyticsRange = "7d" | "30d" | "90d" | "all";

export type AdminProductActions = {
  home_sleep_clicks: number;
  tailored_session_selections: number;
  tailored_session_starts: number;
};

export type AdminAudioEngagementRow = {
  audio_id: string;
  clicks: number;
  starts: number;
  completes: number;
  abandons: number;
  completion_rate: number;
};

export type AdminTailoredSessionRow = {
  session_mode: "calm_mind" | "release_accept";
  selections: number;
  starts: number;
  completes: number;
  dropoffs: number;
  completion_rate: number;
};

const ADMIN_ANALYTICS_CACHE_TTL_MS = 2 * 60 * 1000;

type CachedValue<T> = {
  value: T;
  expiresAt: number;
};

const productActionsCache = new Map<AdminAnalyticsRange, CachedValue<AdminProductActions | null>>();
const audioEngagementCache = new Map<AdminAnalyticsRange, CachedValue<AdminAudioEngagementRow[]>>();
const tailoredSessionsCache = new Map<AdminAnalyticsRange, CachedValue<AdminTailoredSessionRow[]>>();

function getCachedValue<T>(cache: Map<AdminAnalyticsRange, CachedValue<T>>, range: AdminAnalyticsRange): T | null {
  const existing = cache.get(range);
  if (!existing) {
    return null;
  }

  if (existing.expiresAt < Date.now()) {
    cache.delete(range);
    return null;
  }

  return existing.value;
}

function setCachedValue<T>(cache: Map<AdminAnalyticsRange, CachedValue<T>>, range: AdminAnalyticsRange, value: T) {
  cache.set(range, {
    value,
    expiresAt: Date.now() + ADMIN_ANALYTICS_CACHE_TTL_MS,
  });
}

export async function fetchAdminProductActions(range: AdminAnalyticsRange) {
  const cached = getCachedValue(productActionsCache, range);
  if (cached !== null) {
    return { data: cached, error: null };
  }

  const { data, error } = await supabase.rpc("admin_analytics_product_actions", { range_key: range }).single();
  const normalized = (data as AdminProductActions | null) ?? null;
  if (!error) {
    setCachedValue(productActionsCache, range, normalized);
  }

  return { data: normalized, error };
}

export async function fetchAdminAudioEngagement(range: AdminAnalyticsRange) {
  const cached = getCachedValue(audioEngagementCache, range);
  if (cached !== null) {
    return { data: cached, error: null };
  }

  const { data, error } = await supabase.rpc("admin_analytics_audio_engagement", { range_key: range });

  const normalizedRows = ((data as AdminAudioEngagementRow[] | null) ?? []).map((row) => ({
    audio_id: row.audio_id || "unknown_audio",
    clicks: Number(row.clicks) || 0,
    starts: Number(row.starts) || 0,
    completes: Number(row.completes) || 0,
    abandons: Number(row.abandons) || 0,
    completion_rate: Number(row.completion_rate) || 0,
  }));

  if (!error) {
    setCachedValue(audioEngagementCache, range, normalizedRows);
  }

  return { data: normalizedRows, error };
}

export async function fetchAdminTailoredSessions(range: AdminAnalyticsRange) {
  const cached = getCachedValue(tailoredSessionsCache, range);
  if (cached !== null) {
    return { data: cached, error: null };
  }

  const { data, error } = await supabase.rpc("admin_analytics_tailored_sessions", { range_key: range });

  const normalizedRows = ((data as AdminTailoredSessionRow[] | null) ?? []).filter(
    (row): row is AdminTailoredSessionRow => row.session_mode === "calm_mind" || row.session_mode === "release_accept",
  );

  if (!error) {
    setCachedValue(tailoredSessionsCache, range, normalizedRows);
  }

  return { data: normalizedRows, error };
}
