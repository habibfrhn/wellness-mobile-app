import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PENDING_PROFILE_NAME = "wellness.pendingProfileName";

export async function setPendingProfileName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    await AsyncStorage.removeItem(KEY_PENDING_PROFILE_NAME);
    return;
  }

  await AsyncStorage.setItem(KEY_PENDING_PROFILE_NAME, trimmedName);
}

export async function getPendingProfileName() {
  const value = await AsyncStorage.getItem(KEY_PENDING_PROFILE_NAME);
  return value?.trim() ?? "";
}

export async function clearPendingProfileName() {
  await AsyncStorage.removeItem(KEY_PENDING_PROFILE_NAME);
}
