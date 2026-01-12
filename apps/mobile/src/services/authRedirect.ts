import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AuthStackParamList } from "../navigation/types";

const AUTH_NEXT_ROUTE_KEY = "authNextRoute";

export async function setAuthNextRoute(route: keyof AuthStackParamList) {
  await AsyncStorage.setItem(AUTH_NEXT_ROUTE_KEY, route);
}

export async function consumeAuthNextRoute() {
  const route = await AsyncStorage.getItem(AUTH_NEXT_ROUTE_KEY);
  if (route) {
    await AsyncStorage.removeItem(AUTH_NEXT_ROUTE_KEY);
  }
  return route as keyof AuthStackParamList | null;
}
