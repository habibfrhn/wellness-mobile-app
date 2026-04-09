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

export type AdminAnalyticsSnapshot = {
  productActions: AdminProductActions;
  audioRows: AdminAudioEngagementRow[];
  tailoredRows: AdminTailoredSessionRow[];
};

type RpcResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

function toNumber(value: unknown) {
  return Number(value) || 0;
}

async function fetchAdminProductActions(range: AdminAnalyticsRange): Promise<RpcResult<AdminProductActions>> {
  const { data, error } = await supabase.rpc("admin_analytics_product_actions", { range_key: range }).single();

  if (error) {
    return { data: null, error };
  }

  const row = (data as Partial<AdminProductActions> | null) ?? null;

  return {
    data: {
      home_sleep_clicks: toNumber(row?.home_sleep_clicks),
      tailored_session_selections: toNumber(row?.tailored_session_selections),
      tailored_session_starts: toNumber(row?.tailored_session_starts),
    },
    error: null,
  };
}

async function fetchAdminAudioEngagement(range: AdminAnalyticsRange): Promise<RpcResult<AdminAudioEngagementRow[]>> {
  const { data, error } = await supabase.rpc("admin_analytics_audio_engagement", { range_key: range });

  if (error) {
    return { data: null, error };
  }

  const normalizedRows = ((data as Partial<AdminAudioEngagementRow>[] | null) ?? []).map((row) => ({
    audio_id: row.audio_id || "unknown_audio",
    clicks: toNumber(row.clicks),
    starts: toNumber(row.starts),
    completes: toNumber(row.completes),
    abandons: toNumber(row.abandons),
    completion_rate: toNumber(row.completion_rate),
  }));

  return { data: normalizedRows, error: null };
}

async function fetchAdminTailoredSessions(range: AdminAnalyticsRange): Promise<RpcResult<AdminTailoredSessionRow[]>> {
  const { data, error } = await supabase.rpc("admin_analytics_tailored_sessions", { range_key: range });

  if (error) {
    return { data: null, error };
  }

  const normalizedRows = ((data as Partial<AdminTailoredSessionRow>[] | null) ?? [])
    .filter(
      (row): row is AdminTailoredSessionRow =>
        row.session_mode === "calm_mind" || row.session_mode === "release_accept",
    )
    .map((row) => ({
      session_mode: row.session_mode,
      selections: toNumber(row.selections),
      starts: toNumber(row.starts),
      completes: toNumber(row.completes),
      dropoffs: toNumber(row.dropoffs),
      completion_rate: toNumber(row.completion_rate),
    }));

  return { data: normalizedRows, error: null };
}

export async function fetchAdminAnalyticsSnapshot(range: AdminAnalyticsRange): Promise<RpcResult<AdminAnalyticsSnapshot>> {
  const [actionsRes, audioRes, tailoredRes] = await Promise.all([
    fetchAdminProductActions(range),
    fetchAdminAudioEngagement(range),
    fetchAdminTailoredSessions(range),
  ]);

  const firstError = actionsRes.error ?? audioRes.error ?? tailoredRes.error;
  if (firstError) {
    return { data: null, error: firstError };
  }

  return {
    data: {
      productActions: actionsRes.data ?? {
        home_sleep_clicks: 0,
        tailored_session_selections: 0,
        tailored_session_starts: 0,
      },
      audioRows: audioRes.data ?? [],
      tailoredRows: tailoredRes.data ?? [],
    },
    error: null,
  };
}
