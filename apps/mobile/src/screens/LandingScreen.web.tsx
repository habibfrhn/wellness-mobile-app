import React, { useEffect, useRef, useState } from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme/tokens";

type LandingScreenProps = {
  navigation: NavigationProp<ParamListBase>;
};

type SectionKey =
  | "beranda"
  | "hero"
  | "untuk-siapa"
  | "cara-kerja"
  | "manfaat"
  | "diferensiasi"
  | "trust"
  | "faq"
  | "closing-cta";

const MOBILE_BREAKPOINT = 640;

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => window.innerWidth);
  const sectionOffsets = useRef<Record<SectionKey, number>>({
    beranda: 0,
    hero: 0,
    "untuk-siapa": 0,
    "cara-kerja": 0,
    manfaat: 0,
    diferensiasi: 0,
    trust: 0,
    faq: 0,
    "closing-cta": 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isDesktop = viewportWidth > MOBILE_BREAKPOINT;

  const goToAuth = () => {
    navigation.navigate("Auth");
  };

  const goToSection = (key: SectionKey) => {
    if (!isDesktop) return;
    scrollRef.current?.scrollTo({ y: sectionOffsets.current[key], animated: true });
  };

  return (
    <ScrollView ref={scrollRef} style={styles.page} contentContainerStyle={styles.content}>
      <View nativeID="beranda" onLayout={(event) => {
        sectionOffsets.current.beranda = event.nativeEvent.layout.y;
      }} style={[styles.section, styles.headerSection]}>
        <Text style={styles.brand}>Lumepo</Text>

        {isDesktop ? (
          <View style={styles.headerDesktopNav}>
            <Pressable onPress={() => goToSection("beranda")}>
              <Text style={styles.navText}>Beranda</Text>
            </Pressable>
            <Pressable onPress={() => goToSection("untuk-siapa")}>
              <Text style={styles.navText}>Untuk Siapa</Text>
            </Pressable>
            <Pressable onPress={() => goToSection("manfaat")}>
              <Text style={styles.navText}>Manfaat</Text>
            </Pressable>
            <Pressable onPress={() => goToSection("faq")}>
              <Text style={styles.navText}>FAQ</Text>
            </Pressable>
          </View>
        ) : (
          <View />
        )}

        <View style={styles.headerActions}>
          {isDesktop ? (
            <Pressable onPress={goToAuth} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Masuk</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={goToAuth} style={styles.ctaButton}>
            <Text style={styles.ctaText}>Mulai Gratis</Text>
          </Pressable>
        </View>
      </View>

      <View nativeID="hero" onLayout={(event) => {
        sectionOffsets.current.hero = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Hero</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Hero.</Text>
      </View>

      <View nativeID="untuk-siapa" onLayout={(event) => {
        sectionOffsets.current["untuk-siapa"] = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Untuk Siapa</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Untuk Siapa.</Text>
      </View>

      <View nativeID="cara-kerja" onLayout={(event) => {
        sectionOffsets.current["cara-kerja"] = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Cara Kerja</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Cara Kerja.</Text>
      </View>

      <View nativeID="manfaat" onLayout={(event) => {
        sectionOffsets.current.manfaat = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Manfaat</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Manfaat.</Text>
      </View>

      <View nativeID="diferensiasi" onLayout={(event) => {
        sectionOffsets.current.diferensiasi = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Diferensiasi</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Diferensiasi.</Text>
      </View>

      <View nativeID="trust" onLayout={(event) => {
        sectionOffsets.current.trust = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Trust</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Trust.</Text>
      </View>

      <View nativeID="faq" onLayout={(event) => {
        sectionOffsets.current.faq = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        <Text style={styles.sectionBody}>Placeholder konten section FAQ.</Text>
      </View>

      <View nativeID="closing-cta" onLayout={(event) => {
        sectionOffsets.current["closing-cta"] = event.nativeEvent.layout.y;
      }} style={styles.section}>
        <Text style={styles.sectionTitle}>Closing CTA</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Closing CTA.</Text>
        <Pressable onPress={goToAuth} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Mulai Gratis</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  section: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.mutedText}33`,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  brand: {
    fontSize: typography.title,
    fontWeight: "800",
    color: colors.primary,
  },
  headerDesktopNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  navText: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.mutedText,
  },
  ctaButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  ctaText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
});
