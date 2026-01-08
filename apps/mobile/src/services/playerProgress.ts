import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AudioId } from "../content/audioCatalog";

const KEY = "player_progress_v1";

export type PlayerProgress = {
  audioId: AudioId;
  positionSec: number;   // last known position
  updatedAt: number;     // epoch ms
};

export async function saveProgress(p: PlayerProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore storage failures in MVP
  }
}

export async function loadProgress(): Promise<PlayerProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerProgress;
    if (!parsed?.audioId || typeof parsed.positionSec !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
