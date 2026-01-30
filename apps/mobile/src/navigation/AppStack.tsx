import React from "react";
import { Text, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/App/HomeScreen";
import AudioPlayerScreen from "../screens/App/AudioPlayerScreen";
import AccountScreen from "../screens/App/AccountScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import SettingsScreen from "../screens/App/SettingsScreen";
import HomeHeaderMenu from "../components/HomeHeaderMenu";
import type { AppStackParamList } from "./types";
import { colors, typography } from "../theme/tokens";
import { id } from "../i18n/strings";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.bg, height: 32 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        options={({ navigation }) => ({
          headerTitle: "",
          headerLeft: () => <Text style={styles.headerLeftText}>Lumepo</Text>,
          headerRight: () => <HomeHeaderMenu navigation={navigation} />,
        })}
      >
        {(props) => <HomeScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="Player" options={{ title: "Sesi" }}>
        {(props) => <AudioPlayerScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen
        name="Account"
        options={{
          title: "",
          headerBackTitleVisible: false,
        }}
      >
        {(props) => <AccountScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen
        name="Settings"
        options={{
          title: id.account.settingsTitle,
          headerBackTitleVisible: false,
        }}
      >
        {(props) => <SettingsScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="ResetPassword" options={{ title: "Ubah kata sandi" }}>
        {(props) => <ResetPasswordScreen {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerLeftText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
});
