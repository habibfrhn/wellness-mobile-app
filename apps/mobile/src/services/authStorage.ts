import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { secureStoreChunked } from "./secureStoreChunked";

const CODE_VERIFIER_SUFFIX = "-code-verifier";

function buildRelatedAuthStorageKeys(storageKey: string | null) {
  if (!storageKey) {
    return [] as string[];
  }

  return [storageKey, `${storageKey}${CODE_VERIFIER_SUFFIX}`];
}

async function readLegacyValueAndMigrate(storageKey: string) {
  const legacyValue = await AsyncStorage.getItem(storageKey);
  if (!legacyValue) {
    return null;
  }

  await secureStoreChunked.setItem(storageKey, legacyValue);
  await AsyncStorage.removeItem(storageKey);
  return legacyValue;
}

async function removeNativeAuthKey(storageKey: string) {
  await secureStoreChunked.removeItem(storageKey);
  await AsyncStorage.removeItem(storageKey);
}

export const supabaseAuthStorage = {
  async getItem(storageKey: string) {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return null;
      }

      try {
        return window.localStorage.getItem(storageKey);
      } catch {
        return null;
      }
    }

    const secureValue = await secureStoreChunked.getItem(storageKey);
    if (secureValue != null) {
      return secureValue;
    }

    return readLegacyValueAndMigrate(storageKey);
  },
  async setItem(storageKey: string, value: string) {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.setItem(storageKey, value);
      } catch {
        // Ignore browser storage failures; auth SDK will continue using in-memory state.
      }
      return;
    }

    await secureStoreChunked.setItem(storageKey, value);
  },
  async removeItem(storageKey: string) {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return;
      }

      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Ignore browser storage failures; best-effort cleanup only.
      }
      return;
    }

    await removeNativeAuthKey(storageKey);
  },
};

export async function clearSupabaseNativeAuthArtifacts(storageKey: string | null) {
  const keys = buildRelatedAuthStorageKeys(storageKey);
  await Promise.all(keys.map((key) => removeNativeAuthKey(key)));
  return keys;
}

export function getRelatedAuthStorageKeys(storageKey: string | null) {
  return buildRelatedAuthStorageKeys(storageKey);
}
