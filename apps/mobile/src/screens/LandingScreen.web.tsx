import React from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import useViewportWidth from "../hooks/useViewportWidth";
import { colors, radius, spacing, typography, lineHeights } from "../theme/tokens";

type LandingScreenProps = {
  navigation: NavigationProp<ParamListBase>;
};

const WEB_BREAKPOINT = 640;
const HERO_PLACEHOLDER_IMAGE = require("../../assets/image/cover/01-master-cover.jpg");

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const width = useViewportWidth();
  const isDesktopWeb = width > WEB_BREAKPOINT;

  const handleAuthPress = () => {
    navigation.navigate("Auth");
  };

  if (!isDesktopWeb) {
    return (
      <View style={styles.mobilePage}>
        <View style={styles.mobileContent}>
          <Image source={HERO_PLACEHOLDER_IMAGE} style={styles.mobileImage} resizeMode="cover" />
          <Text style={styles.mobileHeadline}>Ritual malam 15 menit untuk menutup hari dengan tenang.</Text>
          <Text style={styles.mobileSubtext}>Tanpa iklan. Tanpa scrolling. Tanpa overstimulation.</Text>

          <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.mobilePrimaryButton, pressed && styles.pressed]}>
            <Text style={styles.mobilePrimaryButtonText}>Coba Gratis (Beta)</Text>
          </Pressable>

          <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.mobileSecondaryButton, pressed && styles.pressed]}>
            <Text style={styles.mobileSecondaryButtonText}>Masuk</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.desktopPage} contentContainerStyle={styles.desktopPageContent}>
      <View style={styles.desktopContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>Lumepo</Text>

          <View style={styles.headerRight}>
            <Text style={styles.navLink}>Fitur</Text>
            <Text style={styles.navLink}>Cara Kerja</Text>
            <Text style={styles.navLink}>FAQ</Text>
            <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
              <Text style={styles.loginButtonText}>Masuk</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.heroImageWrap}>
            <Image source={HERO_PLACEHOLDER_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Ritual malam 15 menit untuk menutup hari dengan tenang.</Text>
            <Text style={styles.heroSubtitle}>Tanpa iklan. Tanpa scrolling. Tanpa overstimulation.</Text>

            <View style={styles.heroActions}>
              <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.heroPrimaryButton, pressed && styles.pressed]}>
                <Text style={styles.heroPrimaryButtonText}>Coba Gratis (Beta)</Text>
              </Pressable>

              <Pressable onPress={handleAuthPress} style={({ pressed }) => [styles.heroSecondaryButton, pressed && styles.pressed]}>
                <Text style={styles.heroSecondaryButtonText}>Jadi Founding Member</Text>
              </Pressable>
            </View>

            <Text style={styles.heroTrustText}>
              Dirancang untuk pekerja yang sulit wind-down karena stres & overthinking.
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Cara Kerja</Text>
          <View style={styles.stepsRow}>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>01</Text>
              <Text style={styles.stepTitle}>Pilih Mode</Text>
              <Text style={styles.stepBody}>Pilih mode yang sesuai kondisi malam kamu dalam hitungan detik.</Text>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>02</Text>
              <Text style={styles.stepTitle}>Ritual 3 Langkah</Text>
              <Text style={styles.stepBody}>Ikuti alur singkat untuk release stres, menenangkan pikiran, dan mematikan layar.</Text>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>03</Text>
              <Text style={styles.stepTitle}>Tidur Lebih Tenang</Text>
              <Text style={styles.stepBody}>Bangun lebih segar karena malam kamu ditutup dengan ritme yang konsisten.</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Apa yang kamu dapat</Text>
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitItem}>• Audio ritual malam singkat tanpa distraksi.</Text>
            <Text style={styles.benefitItem}>• Struktur 15 menit yang mudah diikuti setiap hari.</Text>
            <Text style={styles.benefitItem}>• Pengalaman tenang: tanpa iklan, tanpa scrolling, minim overstimulation.</Text>
            <Text style={styles.benefitItem}>• Fokus pada pemulihan energi dan kualitas tidur yang lebih stabil.</Text>
          </View>
        </View>

        <View style={[styles.infoSection, styles.lastSection]}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Apakah ini aplikasi meditasi?</Text>
              <Text style={styles.faqAnswer}>Bukan. Lumepo dirancang spesifik sebagai ritual malam yang praktis untuk wind-down.</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Berapa lama ritualnya?</Text>
              <Text style={styles.faqAnswer}>Rata-rata 15 menit, jadi mudah konsisten meski hari terasa padat.</Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Apakah saya perlu internet terus?</Text>
              <Text style={styles.faqAnswer}>Beberapa konten bisa dipakai lebih hemat koneksi sesuai dukungan platform saat ini.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mobilePage: {
    flex: 1,
    backgroundColor: colors.bg,
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
    backgroundColor: colors.bg,
  },
  desktopPageContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  desktopContainer: {
    width: "100%",
    maxWidth: 1040,
    marginHorizontal: "auto",
    gap: spacing.xl,
  },
  headerRow: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: `0px 8px 24px ${colors.text}14`,
  },
  brand: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  navLink: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "600",
  },
  loginButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
  },
  loginButtonText: {
    fontSize: typography.small,
    color: colors.white,
    fontWeight: "700",
  },
  heroSection: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: "row",
    gap: spacing.xl,
    boxShadow: `0px 12px 32px ${colors.text}14`,
  },
  heroImageWrap: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    minHeight: 380,
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
  heroTitle: {
    fontSize: typography.h1 + 8,
    lineHeight: typography.h1 + spacing.xl,
    fontWeight: "700",
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: typography.title,
    lineHeight: lineHeights.relaxed + spacing.xs,
    color: colors.mutedText,
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroPrimaryButton: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  heroPrimaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: typography.body,
  },
  heroSecondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: "center",
  },
  heroSecondaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: typography.body,
  },
  heroTrustText: {
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: lineHeights.relaxed,
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  lastSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
  },
  stepsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepNumber: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: typography.title,
    color: colors.text,
    fontWeight: "700",
  },
  stepBody: {
    fontSize: typography.small,
    lineHeight: lineHeights.relaxed,
    color: colors.mutedText,
  },
  benefitsCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  benefitItem: {
    fontSize: typography.body,
    lineHeight: lineHeights.relaxed,
    color: colors.text,
  },
  faqList: {
    gap: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  faqQuestion: {
    fontSize: typography.title,
    color: colors.text,
    fontWeight: "700",
  },
  faqAnswer: {
    fontSize: typography.small,
    lineHeight: lineHeights.relaxed,
    color: colors.mutedText,
  },
  pressed: {
    opacity: 0.85,
  },
});
