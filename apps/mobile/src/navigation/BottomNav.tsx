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
          minHeight: BOTTOM_NAV_HEIGHT + Math.max(insets.bottom, spacing.xs),
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
            style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}
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
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});
