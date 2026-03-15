import React from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/App/HomeScreen";
import NightModeScreen from "../screens/App/NightModeScreen";
import NightCheckInScreen from "../screens/App/NightCheckInScreen";
import NightStep1Screen from "../screens/App/NightStep1Screen";
import NightStep2Screen from "../screens/App/NightStep2Screen";
import NightStep3Screen from "../screens/App/NightStep3Screen";
import NightCheckOutScreen from "../screens/App/NightCheckOutScreen";
import AudioPlayerScreen from "../screens/App/AudioPlayerScreen";
import ProfileScreen from "../screens/App/ProfileScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import SettingsScreen from "../screens/App/SettingsScreen";
import ReminderSettingsScreen from "../screens/App/ReminderSettingsScreen";
import HomeHeaderLogo from "../components/HomeHeaderLogo";
import HomeHeaderMenu from "../components/HomeHeaderMenu";
import type { AppStackParamList } from "./types";
import { colors, spacing } from "../theme/tokens";
import useViewportWidth from "../hooks/useViewportWidth";
import { id } from "../i18n/strings";

const Stack = createNativeStackNavigator<AppStackParamList>();

const WEB_BREAKPOINT = 640;
const DESKTOP_PAGE_PADDING = spacing.lg;

export default function AppStack() {
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && viewportWidth > WEB_BREAKPOINT;

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: isDesktopWeb ? colors.white : colors.bg, height: 32 },
        headerShadowVisible: false,
        ...(isDesktopWeb
          ? {
              headerLeftContainerStyle: { paddingLeft: DESKTOP_PAGE_PADDING - spacing.xs },
              headerRightContainerStyle: { paddingRight: DESKTOP_PAGE_PADDING - spacing.xs },
            }
          : {}),
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


      <Stack.Screen
        name="ReminderSettings"
        options={{
          title: id.account.reminderScreenTitle,
          headerBackTitleVisible: false,
        }}
      >
        {(props) => <ReminderSettingsScreen {...props} />}
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
        component={NightStep3Screen}
        options={{ title: "" }}
      />

      <Stack.Screen
        name="NightCheckOut"
        component={NightCheckOutScreen}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}
