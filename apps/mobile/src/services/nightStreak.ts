import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";
import { deriveNightStreakHeroStateAt, getNightDateKeyAt } from "./nightStreakCore";

const CACHE_KEY_PREFIX = "night:streak_progress_cache:";
const CACHE_TTL_MS = 5 * 60 * 1000;

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
  return getNightDateKeyAt(at);
}

export function deriveNightStreakHeroState(
  progress: NightStreakProgress | null,
  at: Date = new Date(),
): NightStreakHeroState {
  return deriveNightStreakHeroStateAt(progress, at);
}

export async function getNightStreakState(forceRefresh = false): Promise<NightStreakProgress | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id) {
    return null;
  }
  const userId = authData.user.id;

  if (!forceRefresh) {
    const cached = await readCachedNightStreak(userId, false);
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
    return readCachedNightStreak(userId, true);
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

type NightStreakCacheEntry = {
  progress: NightStreakProgress;
  cachedAt: number;
};

async function readCachedNightStreak(userId: string, allowStale: boolean): Promise<NightStreakProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as NightStreakCacheEntry | NightStreakProgress;
    const cacheEntry = toNightStreakCacheEntry(parsed);
    if (!cacheEntry) {
      return null;
    }

    const isFresh = Date.now() - cacheEntry.cachedAt <= CACHE_TTL_MS;
    if (!allowStale && !isFresh) {
      return null;
    }

    return cacheEntry.progress;
  } catch {
    return null;
  }
}

function toNightStreakCacheEntry(value: NightStreakCacheEntry | NightStreakProgress): NightStreakCacheEntry | null {
  if (isNightStreakProgress(value)) {
    return { progress: value, cachedAt: Date.now() };
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !isNightStreakProgress((value as NightStreakCacheEntry).progress) ||
    typeof (value as NightStreakCacheEntry).cachedAt !== "number"
  ) {
    return null;
  }

  return value as NightStreakCacheEntry;
}

function isNightStreakProgress(value: unknown): value is NightStreakProgress {
  return typeof value === "object" && value !== null && typeof (value as NightStreakProgress).userId === "string";
}

async function writeCachedNightStreak(userId: string, progress: NightStreakProgress | null): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    if (!progress) {
      await AsyncStorage.removeItem(cacheKey);
      return;
    }

    const cacheEntry: NightStreakCacheEntry = { progress, cachedAt: Date.now() };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch {
    // Ignore cache failures.
  }
}

