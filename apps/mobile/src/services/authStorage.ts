import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { secureStoreChunked } from "./secureStoreChunked";

const CODE_VERIFIER_SUFFIX = "-code-verifier";

function shouldLogWebStorageWarning(storageKey: string) {
  return !storageKey.endsWith(CODE_VERIFIER_SUFFIX);
}

function getWebStorageCandidates() {
  if (typeof window === "undefined") {
    return [] as Storage[];
  }

  return [window.localStorage, window.sessionStorage];
}

function getWebStorageValue(storageKey: string) {
  for (const storage of getWebStorageCandidates()) {
    try {
      const value = storage.getItem(storageKey);
      if (value != null) {
        return value;
      }
    } catch {
      // Continue with the next candidate.
    }
  }

  if (shouldLogWebStorageWarning(storageKey)) {
    console.warn("[auth-storage] Failed to read auth key from web storage", { storageKey });
  }
  return null;
}

function setWebStorageValue(storageKey: string, value: string) {
  for (const storage of getWebStorageCandidates()) {
    try {
      storage.setItem(storageKey, value);
      return;
    } catch {
      // Continue with the next candidate.
    }
  }

  console.warn("[auth-storage] Failed to persist auth key in web storage", { storageKey });
}

function removeWebStorageValue(storageKey: string) {
  for (const storage of getWebStorageCandidates()) {
    try {
      storage.removeItem(storageKey);
      return;
    } catch {
      // Continue with the next candidate.
    }
  }

  console.warn("[auth-storage] Failed to remove auth key from web storage", { storageKey });
}

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

      return getWebStorageValue(storageKey);
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

      setWebStorageValue(storageKey, value);
      return;
    }

    await secureStoreChunked.setItem(storageKey, value);
  },
  async removeItem(storageKey: string) {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return;
      }

      removeWebStorageValue(storageKey);
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
