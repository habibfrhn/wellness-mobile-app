import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import HomeScreen from "../screens/App/HomeScreen";
import PlayerScreen from "../screens/App/PlayerScreen";
import BreathingPlayerScreen from "../screens/App/BreathingPlayerScreen";
import AccountScreen from "../screens/App/AccountScreen";
import ResetPasswordScreen from "../screens/App/ResetPasswordScreen";
import type {
  AccountStackParamList,
  BreathingStackParamList,
  HomeStackParamList,
  MainTabParamList,
} from "./types";
import { colors, typography } from "../theme/tokens";

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const BreathingStack = createNativeStackNavigator<BreathingStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();

const screenHeader = {
  headerTitleAlign: "center" as const,
  headerStyle: { backgroundColor: colors.bg, height: 32 },
  headerShadowVisible: false,
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={screenHeader}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: "",
          headerLeft: () => <Text style={styles.headerLeftText}>Lumepo</Text>,
        }}
      />
      <HomeStack.Screen name="Player" component={PlayerScreen} options={{ title: "Sesi" }} />
    </HomeStack.Navigator>
  );
}

function BreathingStackScreen() {
  return (
    <BreathingStack.Navigator screenOptions={screenHeader}>
      <BreathingStack.Screen
        name="Breathing"
        component={BreathingPlayerScreen}
        options={{ title: "Latihan napas" }}
      />
    </BreathingStack.Navigator>
  );
}

function AccountStackScreen() {
  return (
    <AccountStack.Navigator screenOptions={screenHeader}>
      <AccountStack.Screen name="Account" component={AccountScreen} options={{ title: "Akun" }} />
      <AccountStack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Ubah kata sandi" }} />
    </AccountStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BreathingTab"
        component={BreathingStackScreen}
        options={{
          tabBarLabel: "Breathing",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="meditation" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStackScreen}
        options={{
          tabBarLabel: "Akun",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = {
  headerLeftText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    paddingHorizontal: 2,
  },
};
