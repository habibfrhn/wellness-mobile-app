import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppStackParamList } from "./types";
import { colors, spacing } from "../theme/tokens";

export const BOTTOM_NAV_HEIGHT = 56;

const tabs = [
  { key: "Home", label: "Home", icon: "home-variant-outline" },
  { key: "Breathing", label: "Breathing", icon: "meditation" },
  { key: "Account", label: "Akun", icon: "account-circle-outline" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const routeToTab = (routeName: string): TabKey => {
  if (routeName === "Breathing") return "Breathing";
  if (routeName === "Account" || routeName === "ResetPassword") return "Account";
  return "Home";
};

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  routeName: string;
};

export default function BottomNav({ navigation, routeName }: Props) {
  const insets = useSafeAreaInsets();
  const activeTab = routeToTab(routeName);

  return (
    <View
      style={[
        styles.container,
        {
          height: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, spacing.xs),
          paddingBottom: Math.max(insets.bottom, spacing.xs),
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => navigation.navigate(tab.key)}
            android_ripple={{ color: "transparent" }}
            style={styles.tabItem}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isActive ? colors.primary : colors.mutedText}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    height: BOTTOM_NAV_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
  },
});
