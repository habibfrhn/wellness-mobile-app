import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";

const CACHE_KEY_PREFIX = "night:streak_progress_cache:";

export type NightStreakProgress = {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  totalCompletedSessions: number;
  createdAt: string;
  updatedAt: string;
};

type NightStreakProgressRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_completed_sessions: number;
  created_at: string;
  updated_at: string;
};

export type NightStreakHeroState =
  | { kind: "no_streak" }
  | { kind: "active"; count: number }
  | { kind: "broken" };

export function getNightDateKey(at: Date = new Date()): string {
  return formatDateKey(at);
}

export function deriveNightStreakHeroState(
  progress: NightStreakProgress | null,
  at: Date = new Date(),
): NightStreakHeroState {
  if (!progress || progress.totalCompletedSessions <= 0 || !progress.lastCompletedDate) {
    return { kind: "no_streak" };
  }

  const dayGap = getDateKeyGap(progress.lastCompletedDate, getNightDateKey(at));

  if (dayGap === null) {
    return { kind: "no_streak" };
  }

  if (dayGap <= 1 && progress.currentStreak > 0) {
    return { kind: "active", count: progress.currentStreak };
  }

  return { kind: "broken" };
}

export async function getNightStreakState(forceRefresh = false): Promise<NightStreakProgress | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    return null;
  }
  const userId = authData.user.id;

  if (!forceRefresh) {
    const cached = await readCachedNightStreak(userId);
    if (cached) {
      return cached;
    }
  }

  const { data, error } = await supabase
    .from("night_streak_progress")
    .select("user_id,current_streak,longest_streak,last_completed_date,total_completed_sessions,created_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle<NightStreakProgressRow>();

  if (error) {
    return readCachedNightStreak(userId);
  }

  const mapped = data ? mapRowToProgress(data) : null;
  await writeCachedNightStreak(userId, mapped);
  return mapped;
}

function mapRowToProgress(row: NightStreakProgressRow): NightStreakProgress {
  return {
    userId: row.user_id,
    currentStreak: Math.max(0, row.current_streak ?? 0),
    longestStreak: Math.max(0, row.longest_streak ?? 0),
    lastCompletedDate: row.last_completed_date,
    totalCompletedSessions: Math.max(0, row.total_completed_sessions ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readCachedNightStreak(userId: string): Promise<NightStreakProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as NightStreakProgress;
    if (!parsed?.userId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function writeCachedNightStreak(userId: string, progress: NightStreakProgress | null): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    if (!progress) {
      await AsyncStorage.removeItem(cacheKey);
      return;
    }

    await AsyncStorage.setItem(cacheKey, JSON.stringify(progress));
  } catch {
    // Ignore cache failures.
  }
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateKeyGap(fromDateKey: string, toDateKey: string): number | null {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKey);

  if (!from || !to) {
    return null;
  }

  const dayInMs = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / dayInMs);
}

function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;
  const day = Number.parseInt(match[3], 10);

  const parsed = new Date(Date.UTC(year, monthIndex, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthIndex ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}
