import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_AUTH_START = "wellness.authStartRoute";

export type AuthStartRoute = "Welcome" | "Login" | "ResetPassword";

export async function setNextAuthRoute(route: AuthStartRoute) {
  await AsyncStorage.setItem(KEY_AUTH_START, route);
}

export async function getNextAuthRoute(): Promise<AuthStartRoute | null> {
  const stored = await AsyncStorage.getItem(KEY_AUTH_START);
  if (stored === "Welcome" || stored === "Login" || stored === "ResetPassword") {
    return stored;
  }
  return null;
}

export async function clearNextAuthRoute() {
  await AsyncStorage.removeItem(KEY_AUTH_START);
}
