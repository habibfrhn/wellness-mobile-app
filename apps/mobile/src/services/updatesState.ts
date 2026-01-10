import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PENDING_UPDATE = "updates:pending";

/**
 * Pending update = user was informed an OTA update exists but chose "Later".
 * We store a boolean so Account screen can offer "Unduh pembaruan".
 */
export async function getPendingUpdate(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY_PENDING_UPDATE);
    return v === "1";
  } catch {
    return false;
  }
}

export async function setPendingUpdate(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PENDING_UPDATE, value ? "1" : "0");
  } catch {
    // ignore
  }
}
