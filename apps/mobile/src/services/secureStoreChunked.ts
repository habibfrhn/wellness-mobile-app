import * as SecureStore from "expo-secure-store";

/**
 * expo-secure-store key rules (Android):
 * - Not empty
 * - Only alphanumeric + ".", "-", "_"
 *
 * Also warns around ~2048 bytes for value size.
 * We'll chunk large values and store meta + chunks.
 */
const CHUNK_SIZE = 1800;

function sanitizeKey(key: string): string {
  const k = (key ?? "").trim();
  // Replace any invalid chars with "_"
  const sanitized = k.replace(/[^A-Za-z0-9._-]/g, "_");
  if (!sanitized) {
    throw new Error("SecureStore: empty/invalid key after sanitization.");
  }
  return sanitized;
}

function metaKey(key: string) {
  // Use only allowed characters
  return `${sanitizeKey(key)}__meta`;
}

function chunkKey(key: string, index: number) {
  return `${sanitizeKey(key)}__chunk__${index}`;
}

async function safeGetItem(rawKey: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(rawKey);
  } catch {
    return null;
  }
}

async function safeSetItem(rawKey: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(rawKey, value);
}

async function safeDeleteItem(rawKey: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(rawKey);
  } catch {
    // ignore
  }
}

export const secureStoreChunked = {
  async getItem(key: string): Promise<string | null> {
    // 1) Try chunked storage
    const mk = metaKey(key);
    const metaRaw = await safeGetItem(mk);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw) as { chunks: number };
        const count = meta?.chunks ?? 0;
        if (count > 0) {
          const parts: string[] = [];
          for (let i = 0; i < count; i++) {
            const part = await safeGetItem(chunkKey(key, i));
            if (part == null) return null;
            parts.push(part);
          }
          return parts.join("");
        }
      } catch {
        // If meta corrupt, fall through to legacy
      }
    }

    // 2) Legacy fallback: try original key as-is (if valid)
    const legacy = await safeGetItem(key);
    if (legacy != null) return legacy;

    // 3) Legacy fallback: try sanitized key (rare edge case)
    const sanitized = sanitizeKey(key);
    if (sanitized !== key) {
      const legacySanitized = await safeGetItem(sanitized);
      if (legacySanitized != null) return legacySanitized;
    }

    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    // Clean old chunked + legacy entries first
    await this.removeItem(key);

    const parts: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      parts.push(value.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < parts.length; i++) {
      await safeSetItem(chunkKey(key, i), parts[i]);
    }

    await safeSetItem(metaKey(key), JSON.stringify({ chunks: parts.length }));
  },

  async removeItem(key: string): Promise<void> {
    // Remove chunked keys if present
    const mk = metaKey(key);
    const metaRaw = await safeGetItem(mk);
    if (metaRaw) {
      try {
        const meta = JSON.parse(metaRaw) as { chunks: number };
        const count = meta?.chunks ?? 0;
        for (let i = 0; i < count; i++) {
          await safeDeleteItem(chunkKey(key, i));
        }
      } catch {
        // ignore
      }
      await safeDeleteItem(mk);
    } else {
      // Best effort cleanup (if meta missing)
      for (let i = 0; i < 10; i++) {
        await safeDeleteItem(chunkKey(key, i));
      }
      await safeDeleteItem(mk);
    }

    // Remove legacy single-key storage too (if any)
    await safeDeleteItem(key);
    const sanitized = sanitizeKey(key);
    if (sanitized !== key) await safeDeleteItem(sanitized);
  }
};
