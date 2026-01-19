import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/App/HomeScreen";
import PlayerScreen from "../screens/App/PlayerScreen";
import BreathingPlayerScreen from "../screens/App/BreathingPlayerScreen";
import AccountScreen from "../screens/App/AccountScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import type { AppStackParamList } from "./types";
import { colors, typography } from "../theme/tokens";
import BottomNav from "./BottomNav";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <View style={styles.container}>
      <View style={styles.stackWrap}>
        <Stack.Navigator
          screenOptions={{
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: colors.bg, height: 32 },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerTitle: "",
              headerLeft: () => <Text style={styles.headerLeftText}>Lumepo</Text>,
            }}
          />

          <Stack.Screen name="Breathing" component={BreathingPlayerScreen} options={{ title: "Latihan napas" }} />
          <Stack.Screen name="Player" component={PlayerScreen} options={{ title: "Sesi" }} />
          <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Akun" }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Ubah kata sandi" }} />
        </Stack.Navigator>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  stackWrap: { flex: 1 },
  headerLeftText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
});
