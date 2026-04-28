import type { NightStreakHeroState, NightStreakProgress } from "./nightStreak";

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getNightDateKeyAt(at: Date = new Date()): string {
  return formatDateKey(at);
}

export function deriveNightStreakHeroStateAt(
  progress: NightStreakProgress | null,
  at: Date = new Date(),
): NightStreakHeroState {
  if (!progress || progress.totalCompletedSessions <= 0 || !progress.lastCompletedDate) {
    return { kind: "no_streak" };
  }

  const dayGap = getDateKeyGap(progress.lastCompletedDate, getNightDateKeyAt(at));

  if (dayGap === null) {
    return { kind: "no_streak" };
  }

  if (dayGap <= 1 && progress.currentStreak > 0) {
    return { kind: "active", count: progress.currentStreak };
  }

  return { kind: "broken" };
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
