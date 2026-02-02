import React, { useState } from "react";
import { View, Pressable, StyleSheet, Text, Modal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing, radius, typography } from "../theme/tokens";
import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function HomeHeaderMenu({ navigation }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const handleNavigate = (route: keyof AppStackParamList) => {
    setIsOpen(false);
    navigation.navigate(route);
  };

  const iconColor = isOpen ? colors.card : colors.text;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.menuButton,
          isOpen && styles.menuButtonActive,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons name="menu" size={typography.iconMd} color={iconColor} />
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.dropdown, { top: insets.top + spacing.lg }]}>
            <Pressable
              onPress={() => handleNavigate("Account")}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={typography.iconSm} color={colors.text} />
              <View style={styles.menuTextWrapper}>
                <Text style={styles.menuText}>{id.account.profileMenu}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => handleNavigate("Settings")}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <MaterialCommunityIcons name="cog-outline" size={typography.iconSm} color={colors.text} />
              <View style={styles.menuTextWrapper}>
                <Text style={styles.menuText}>{id.account.settingsMenu}</Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingHorizontal: spacing.xs,
  },
  menuButton: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: spacing.xl / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonActive: {
    backgroundColor: colors.mutedText,
  },
  overlay: {
    flex: 1,
  },
  dropdown: {
    position: "absolute",
    right: spacing.sm + spacing.xs / 4,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm / 2,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm / 2,
  },
  menuTextWrapper: {
    alignItems: "flex-start",
    paddingRight: spacing.sm,
  },
  menuItemPressed: {
    backgroundColor: colors.bg,
  },
  menuText: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "700",
    textAlign: "left",
  },
  pressed: {
    opacity: 0.75,
  },
});
