import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type LandingMobileAuthMenuProps = {
  onPressLogin: () => void;
  onPressSignUp: () => void;
  onPressFaq: () => void;
  onPressPrivacyPolicy: () => void;
  onPressTermsConditions: () => void;
};

export default function LandingMobileAuthMenu({
  onPressLogin,
  onPressSignUp,
  onPressFaq,
  onPressPrivacyPolicy,
  onPressTermsConditions,
}: LandingMobileAuthMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => {
    if (Platform.OS === "web" && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setIsOpen(false));
      return;
    }
    setIsOpen(false);
  };

  const handlePressLogin = () => {
    closeMenu();
    onPressLogin();
  };

  const handlePressSignUp = () => {
    closeMenu();
    onPressSignUp();
  };

  const handlePressFaq = () => {
    closeMenu();
    onPressFaq();
  };

  const handlePressPrivacyPolicy = () => {
    closeMenu();
    onPressPrivacyPolicy();
  };

  const handlePressTermsConditions = () => {
    closeMenu();
    onPressTermsConditions();
  };

  const menuItems = [
    { key: "login", label: id.login.primaryCta, onPress: handlePressLogin },
    { key: "signup", label: id.signup.primaryCta, onPress: handlePressSignUp },
    { key: "faq", label: "FAQ", onPress: handlePressFaq },
    { key: "privacy", label: id.account.privacy, onPress: handlePressPrivacyPolicy },
    { key: "terms", label: id.account.terms, onPress: handlePressTermsConditions },
  ];

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
        onRequestClose={closeMenu}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <View style={styles.dropdown}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
              >
                <Text style={styles.menuText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    minHeight: 44,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
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
