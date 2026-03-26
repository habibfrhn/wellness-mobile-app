import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme/tokens";
import LandingMobileAuthMenu from "./LandingMobileAuthMenu";

type NavItemKey = "home" | "faq" | "privacy-policy" | "terms-conditions";

type Props = {
  activeItem: NavItemKey;
  isDesktop: boolean;
  isTablet: boolean;
  onPressHome: () => void;
  onPressFaq: () => void;
  onPressPrivacyPolicy: () => void;
  onPressTermsConditions: () => void;
  onPressLogin: () => void;
  onPressSignUp: () => void;
};

const NAV_ITEMS: Array<{ key: NavItemKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "faq", label: "FAQ" },
  { key: "privacy-policy", label: "Kebijakan Privasi" },
  { key: "terms-conditions", label: "Syarat & Ketentuan" },
];

export default function LandingContextHeader({
  activeItem,
  isDesktop,
  isTablet,
  onPressHome,
  onPressFaq,
  onPressPrivacyPolicy,
  onPressTermsConditions,
  onPressLogin,
  onPressSignUp,
}: Props) {
  const onPressMap: Record<NavItemKey, () => void> = {
    home: onPressHome,
    faq: onPressFaq,
    "privacy-policy": onPressPrivacyPolicy,
    "terms-conditions": onPressTermsConditions,
  };

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        <Text style={styles.brand}>Lumepo</Text>

        {isDesktop || isTablet ? (
          <View style={styles.navRow}>
            {NAV_ITEMS.map((item) => (
              <Pressable key={item.key} onPress={onPressMap[item.key]} style={styles.navItem}>
                <Text style={styles.navText}>{item.label}</Text>
                <View style={[styles.navUnderline, item.key === activeItem && styles.navUnderlineActive]} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View />
        )}

        <View style={[styles.actions, !isDesktop && !isTablet && styles.actionsMobile]}>
          {!isDesktop && !isTablet ? (
            <LandingMobileAuthMenu onPressLogin={onPressLogin} onPressSignUp={onPressSignUp} />
          ) : (
            <>
              <Pressable onPress={onPressLogin} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Masuk</Text>
              </Pressable>
              <Pressable onPress={onPressSignUp} style={styles.primaryButton}>
                <Text style={styles.primaryButtonLabel}>Buat akun</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    backgroundColor: colors.white,
    position: "sticky" as any,
    top: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.mutedText}1A`,
  },
  inner: {
    width: "100%",
    maxWidth: 1100,
    marginHorizontal: "auto",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  innerDesktop: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brand: {
    fontSize: typography.title,
    fontWeight: "800",
    color: colors.primary,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  navItem: {
    position: "relative",
    paddingBottom: spacing.xs,
  },
  navText: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "600",
  },
  navUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0,
  },
  navUnderlineActive: {
    opacity: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionsMobile: {
    gap: spacing.xs,
  },
  textButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  textButtonLabel: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  primaryButtonLabel: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
});
