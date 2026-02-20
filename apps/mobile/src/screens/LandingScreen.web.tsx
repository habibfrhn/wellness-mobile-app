import React from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import useViewportWidth from "../hooks/useViewportWidth";
import { colors, radius, spacing, typography, lineHeights } from "../theme/tokens";

type LandingScreenProps = {
  navigation: NavigationProp<ParamListBase>;
};

const WEB_BREAKPOINT = 640;
const COMPACT_DESKTOP_BREAKPOINT = 1024;
const HERO_IMAGE = require("../../assets/image/landing-page/1.jpg");

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const width = useViewportWidth();
  const isDesktopWeb = width > WEB_BREAKPOINT;
  const isCompactDesktop = width <= COMPACT_DESKTOP_BREAKPOINT;

  const handleAuthPress = () => {
    navigation.navigate("Auth");
  };

  if (!isDesktopWeb) {
    return (
      <View style={styles.mobilePage}>
        <View style={styles.mobileContent}>
          <Image source={HERO_IMAGE} style={styles.mobileImage} resizeMode="cover" />
          <Text style={styles.mobileHeadline}>{id.landing.mobileHeadline}</Text>
          <Text style={styles.mobileSubtext}>{id.landing.mobileSubtext}</Text>

          <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.mobilePrimaryButton, pressed && styles.pressed]}>
            <Text style={styles.mobilePrimaryButtonText}>{id.landing.mobilePrimaryCta}</Text>
          </Pressable>

          <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.mobileSecondaryButton, pressed && styles.pressed]}>
            <Text style={styles.mobileSecondaryButtonText}>{id.landing.mobileSecondaryCta}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.desktopPage}>
      <View style={styles.headerShell}>
        <View style={styles.header}>
          <Text style={styles.brand}>Lumepo</Text>

          {!isCompactDesktop ? (
            <View style={styles.navRow}>
              <Text style={[styles.navLink, styles.navLinkActive]}>{id.landing.navHome}</Text>
              <Text style={styles.navLink}>{id.landing.navWhoWeServe}</Text>
              <Text style={styles.navLink}>{id.landing.navFeatures}</Text>
              <Text style={styles.navLink}>{id.landing.navResources}</Text>
            </View>
          ) : (
            <View />
          )}

          <View style={styles.headerActions}>
            <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.loginGhost, pressed && styles.pressed]}>
              <Text style={styles.loginGhostText}>{id.landing.loginCta}</Text>
            </Pressable>
            <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.getStartedButton, pressed && styles.pressed]}>
              <Text style={styles.getStartedText}>{id.landing.getStartedCta}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.desktopContainer}>
        <View style={[styles.heroCard, isCompactDesktop && styles.heroCardCompact]}>
          <View style={styles.heroLeft}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{id.landing.badge}</Text>
            </View>

            <Text style={styles.heroIntro}>{id.landing.heroIntro}</Text>
            <Text style={styles.heroTitle}>{id.landing.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{id.landing.heroSubtitle}</Text>

            <View style={styles.heroActions}>
              <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}>
                <Text style={styles.primaryCtaText}>{id.landing.getStartedCta}</Text>
              </Pressable>
              <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}>
                <Text style={styles.secondaryCtaText}>{id.landing.secondaryHeroCta}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroRight, isCompactDesktop && styles.heroRightCompact]}>
            <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>

        <View style={styles.logoRow}>
          <Text style={styles.logoText}>NVIDIA</Text>
          <Text style={styles.logoText}>INCEPTION PROGRAM</Text>
          <Text style={styles.logoText}>HOSPITAL LOGO</Text>
          <Text style={styles.logoText}>Better Healthcare</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobilePage: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  mobileContent: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
  mobileImage: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
  },
  mobileHeadline: {
    fontSize: typography.h1,
    lineHeight: typography.h1 + spacing.sm,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text,
  },
  mobileSubtext: {
    fontSize: typography.body,
    lineHeight: lineHeights.relaxed,
    textAlign: "center",
    color: colors.mutedText,
  },
  mobilePrimaryButton: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.text,
    alignItems: "center",
  },
  mobilePrimaryButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  mobileSecondaryButton: {
    width: "100%",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    backgroundColor: colors.secondary,
  },
  mobileSecondaryButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.secondaryText,
  },
  desktopPage: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  headerShell: {
    width: "100%",
    paddingHorizontal: spacing.lg,
  },
  desktopContainer: {
    width: "100%",
    maxWidth: 1100,
    marginHorizontal: "auto",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: typography.title,
    color: colors.primary,
    fontWeight: "800",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  navLink: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "600",
  },
  navLinkActive: {
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loginGhost: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  loginGhostText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
  },
  getStartedButton: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  getStartedText: {
    fontSize: typography.small,
    fontWeight: "700",
    color: colors.primaryText,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    gap: spacing.xl,
    alignItems: "stretch",
  },
  heroCardCompact: {
    flexDirection: "column-reverse",
  },
  heroLeft: {
    flex: 1,
    gap: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  heroIntro: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 54,
    lineHeight: 58,
    color: colors.text,
    fontWeight: "800",
    letterSpacing: -1,
    maxWidth: 540,
  },
  heroSubtitle: {
    fontSize: typography.title,
    lineHeight: lineHeights.relaxed + spacing.xs,
    color: colors.mutedText,
    maxWidth: 520,
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  primaryCta: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryCtaText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  secondaryCta: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryCtaText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
  },
  heroRight: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    minHeight: 560,
    height: 560,
  },
  heroRightCompact: {
    minHeight: 360,
    height: 360,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  logoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  logoText: {
    fontSize: typography.caption,
    color: colors.mutedText,
    fontWeight: "700",
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.85,
  },
});
