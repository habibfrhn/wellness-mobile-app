import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PENDING_FOUNDING_MEMBER_INTENT = "wellness.pendingFoundingMemberIntent";

export async function setPendingFoundingMemberIntent() {
  await AsyncStorage.setItem(KEY_PENDING_FOUNDING_MEMBER_INTENT, "1");
}

export async function consumePendingFoundingMemberIntent() {
  const value = await AsyncStorage.getItem(KEY_PENDING_FOUNDING_MEMBER_INTENT);
  await AsyncStorage.removeItem(KEY_PENDING_FOUNDING_MEMBER_INTENT);

  return value === "1";
}

