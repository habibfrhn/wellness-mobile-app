import React, { useState } from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing, radius, typography } from "../theme/tokens";
import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function HomeHeaderMenu({ navigation }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (route: keyof AppStackParamList) => {
    setIsOpen(false);
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        hitSlop={8}
        style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="menu" size={22} color={colors.text} />
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdown}>
          <Pressable
            onPress={() => handleNavigate("Account")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={20} color={colors.text} />
            <Text style={styles.menuText}>{id.account.profileMenu}</Text>
          </Pressable>

          <Pressable
            onPress={() => handleNavigate("Settings")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.text} />
            <Text style={styles.menuText}>{id.account.settingsMenu}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingHorizontal: spacing.xs,
  },
  menuButton: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  dropdown: {
    position: "absolute",
    top: 34,
    right: 0,
    minWidth: 170,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  menuItemPressed: {
    backgroundColor: colors.bg,
  },
  menuText: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});
