import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type LandingMobileAuthMenuProps = {
  onPressLogin: () => void;
  onPressSignUp: () => void;
};

export default function LandingMobileAuthMenu({
  onPressLogin,
  onPressSignUp,
}: LandingMobileAuthMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePressLogin = () => {
    setIsOpen(false);
    onPressLogin();
  };

  const handlePressSignUp = () => {
    setIsOpen(false);
    onPressSignUp();
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={id.landing.mobileMenuLabel}
        accessibilityHint={id.landing.mobileMenuHint}
        onPress={() => setIsOpen((prev) => !prev)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.menuButton,
          isOpen && styles.menuButtonActive,
          pressed && styles.menuButtonPressed,
        ]}
      >
        <MaterialCommunityIcons
          name="menu"
          size={typography.iconMd}
          color={isOpen ? colors.white : colors.text}
        />
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            <Pressable
              onPress={handlePressSignUp}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={styles.menuText}>{id.signup.primaryCta}</Text>
            </Pressable>

            <Pressable
              onPress={handlePressLogin}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <Text style={styles.menuText}>{id.login.primaryCta}</Text>
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
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: `${colors.mutedText}22`,
    boxShadow: `0px 4px 12px ${colors.text}12`,
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  menuButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  menuButtonPressed: {
    opacity: 0.85,
  },
  overlay: {
    flex: 1,
    paddingTop: spacing.xl + spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.12)",
  },
  dropdown: {
    minWidth: 168,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.xs,
    gap: spacing.xs,
    boxShadow: `0px 14px 34px ${colors.text}18`,
    elevation: Platform.OS === "android" ? 3 : 0,
  },
  menuItem: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItemPressed: {
    backgroundColor: colors.bg,
  },
  menuText: {
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
});
