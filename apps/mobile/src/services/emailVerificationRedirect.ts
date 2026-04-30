import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PENDING_EMAIL_VERIFICATION = "wellness.pendingEmailVerification";

type PendingVerification = {
  email: string;
  createdAtMs: number;
};

const MAX_PENDING_AGE_MS = 1000 * 60 * 60 * 24;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function setPendingEmailVerification(email: string) {
  const payload: PendingVerification = {
    email: normalizeEmail(email),
    createdAtMs: Date.now(),
  };
  await AsyncStorage.setItem(KEY_PENDING_EMAIL_VERIFICATION, JSON.stringify(payload));
}

export async function clearPendingEmailVerification() {
  await AsyncStorage.removeItem(KEY_PENDING_EMAIL_VERIFICATION);
}

export async function matchesPendingEmailVerification(email: string | null | undefined) {
  const normalizedEmail = typeof email === "string" ? normalizeEmail(email) : "";
  if (!normalizedEmail) {
    return false;
  }

  const raw = await AsyncStorage.getItem(KEY_PENDING_EMAIL_VERIFICATION);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as PendingVerification;
    if (!parsed?.email || typeof parsed.createdAtMs !== "number") {
      await clearPendingEmailVerification();
      return false;
    }

    if (Date.now() - parsed.createdAtMs > MAX_PENDING_AGE_MS) {
      await clearPendingEmailVerification();
      return false;
    }

    return parsed.email === normalizedEmail;
  } catch {
    await clearPendingEmailVerification();
    return false;
  }
}
