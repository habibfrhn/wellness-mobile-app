import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_LAST_COMPLETION_DATE_KEY = "night:last_completion_date_key";
const KEY_STREAK_COUNT = "night:streak_count";

export type NightStreakState = {
  lastCompletionDateKey: string | null;
  streakCount: number;
};

/**
 * Convert a timestamp into a local `date_key` used by the night ritual streak logic.
 *
 * Product rule:
 * - 18:00–23:59 belongs to that same "night" date.
 * - 00:00–02:59 belongs to the previous "night" date.
 *
 * Outside that window we still return a deterministic local date key so callers
 * can safely use the function at any time.
 */
export function getNightDateKey(at: Date = new Date()): string {
  const local = new Date(at);
  const hour = local.getHours();

  if (hour < 3) {
    local.setDate(local.getDate() - 1);
  }

  return formatDateKey(local);
}

export async function getNightStreakState(): Promise<NightStreakState> {
  try {
    const [lastCompletionDateKey, streakCountRaw] = await Promise.all([
      AsyncStorage.getItem(KEY_LAST_COMPLETION_DATE_KEY),
      AsyncStorage.getItem(KEY_STREAK_COUNT),
    ]);

    const streakCountParsed = Number.parseInt(streakCountRaw ?? "0", 10);
    const streakCount = Number.isFinite(streakCountParsed) && streakCountParsed > 0 ? streakCountParsed : 0;

    return {
      lastCompletionDateKey,
      streakCount,
    };
  } catch {
    return {
      lastCompletionDateKey: null,
      streakCount: 0,
    };
  }
}

/**
 * Record a completed night session and return the updated streak state.
 *
 * Rules:
 * - same date_key: keep streak unchanged (prevents double counting in one night)
 * - consecutive date_key: increment streak
 * - otherwise: reset streak to 1
 */
export async function registerNightCompletion(at: Date = new Date()): Promise<NightStreakState> {
  const completionDateKey = getNightDateKey(at);

  const previous = await getNightStreakState();

  let nextStreak = 1;

  if (previous.lastCompletionDateKey === completionDateKey) {
    nextStreak = Math.max(previous.streakCount, 1);
  } else if (
    previous.lastCompletionDateKey &&
    isConsecutiveDateKey(previous.lastCompletionDateKey, completionDateKey)
  ) {
    nextStreak = Math.max(previous.streakCount, 0) + 1;
  }

  try {
    await Promise.all([
      AsyncStorage.setItem(KEY_LAST_COMPLETION_DATE_KEY, completionDateKey),
      AsyncStorage.setItem(KEY_STREAK_COUNT, String(nextStreak)),
    ]);
  } catch {
    // Ignore persistence failures and still return computed state to keep UI responsive.
  }

  return {
    lastCompletionDateKey: completionDateKey,
    streakCount: nextStreak,
  };
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isConsecutiveDateKey(previousDateKey: string, nextDateKey: string): boolean {
  const previous = parseDateKey(previousDateKey);
  const next = parseDateKey(nextDateKey);

  if (!previous || !next) {
    return false;
  }

  const dayInMs = 24 * 60 * 60 * 1000;
  return next.getTime() - previous.getTime() === dayInMs;
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

