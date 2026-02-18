import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/App/HomeScreen";
import NightModeScreen from "../screens/App/NightModeScreen";
import NightCheckInScreen from "../screens/App/NightCheckInScreen";
import NightStep1Screen from "../screens/App/NightStep1Screen";
import NightStep2Screen from "../screens/App/NightStep2Screen";
import AudioPlayerScreen from "../screens/App/AudioPlayerScreen";
import ProfileScreen from "../screens/App/ProfileScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import SettingsScreen from "../screens/App/SettingsScreen";
import HomeHeaderLogo from "../components/HomeHeaderLogo";
import HomeHeaderMenu from "../components/HomeHeaderMenu";
import type { AppStackParamList } from "./types";
import { colors } from "../theme/tokens";
import { id } from "../i18n/strings";

const Stack = createNativeStackNavigator<AppStackParamList>();

function NightStep3PlaceholderScreen() {
  return null;
}

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
          headerLeft: () => <HomeHeaderLogo />,
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
        {(props) => <ProfileScreen {...props} />}
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

      <Stack.Screen
        name="NightMode"
        component={NightModeScreen}
        options={{ title: "" }}
      />

      <Stack.Screen
        name="NightCheckIn"
        component={NightCheckInScreen}
        options={{ title: "" }}
      />

      <Stack.Screen
        name="NightStep1"
        component={NightStep1Screen}
        options={{ title: "" }}
      />

      <Stack.Screen
        name="NightStep2"
        component={NightStep2Screen}
        options={{ title: "" }}
      />

      <Stack.Screen
        name="NightStep3"
        component={NightStep3PlaceholderScreen}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}
