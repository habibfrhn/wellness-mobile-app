import React, { useRef } from "react";
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

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const sectionRefs = useRef<Record<SectionKey, View | null>>({
    beranda: null,
    hero: null,
    "untuk-siapa": null,
    "cara-kerja": null,
    manfaat: null,
    diferensiasi: null,
    trust: null,
    faq: null,
    "closing-cta": null,
  });

  const goToAuth = () => {
    navigation.navigate("Auth");
  };

  const goToSection = (key: SectionKey) => {
    const target = sectionRefs.current[key];
    if (!target || !scrollRef.current) return;

    target.measureLayout(scrollRef.current.getInnerViewNode(), (_x, y) => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  return (
    <ScrollView ref={scrollRef} style={styles.page} contentContainerStyle={styles.content}>
      <View ref={(node) => {
          sectionRefs.current.beranda = node;
        }} nativeID="beranda" style={styles.section}>
        <Text style={styles.sectionTitle}>Header</Text>
        <View style={styles.row}>
          <Pressable onPress={() => goToSection("untuk-siapa")} style={styles.linkButton}>
            <Text style={styles.linkText}>Untuk Siapa</Text>
          </Pressable>
          <Pressable onPress={() => goToSection("cara-kerja")} style={styles.linkButton}>
            <Text style={styles.linkText}>Cara Kerja</Text>
          </Pressable>
          <Pressable onPress={() => goToSection("faq")} style={styles.linkButton}>
            <Text style={styles.linkText}>FAQ</Text>
          </Pressable>
          <Pressable onPress={goToAuth} style={styles.ctaButton}>
            <Text style={styles.ctaText}>Masuk / Daftar</Text>
          </Pressable>
        </View>
      </View>

      <View ref={(node) => {
          sectionRefs.current.hero = node;
        }} nativeID="hero" style={styles.section}>
        <Text style={styles.sectionTitle}>Hero</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Hero.</Text>
        <Pressable onPress={goToAuth} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Mulai Sekarang</Text>
        </Pressable>
      </View>

      <View ref={(node) => {
          sectionRefs.current["untuk-siapa"] = node;
        }} nativeID="untuk-siapa" style={styles.section}>
        <Text style={styles.sectionTitle}>Untuk Siapa</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Untuk Siapa.</Text>
      </View>

      <View ref={(node) => {
          sectionRefs.current["cara-kerja"] = node;
        }} nativeID="cara-kerja" style={styles.section}>
        <Text style={styles.sectionTitle}>Cara Kerja</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Cara Kerja.</Text>
      </View>

      <View ref={(node) => {
          sectionRefs.current.manfaat = node;
        }} nativeID="manfaat" style={styles.section}>
        <Text style={styles.sectionTitle}>Manfaat</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Manfaat.</Text>
      </View>

      <View ref={(node) => {
          sectionRefs.current.diferensiasi = node;
        }} nativeID="diferensiasi" style={styles.section}>
        <Text style={styles.sectionTitle}>Diferensiasi</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Diferensiasi.</Text>
      </View>

      <View ref={(node) => {
          sectionRefs.current.trust = node;
        }} nativeID="trust" style={styles.section}>
        <Text style={styles.sectionTitle}>Trust</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Trust.</Text>
      </View>

      <View ref={(node) => {
          sectionRefs.current.faq = node;
        }} nativeID="faq" style={styles.section}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        <Text style={styles.sectionBody}>Placeholder konten section FAQ.</Text>
      </View>

      <View ref={(node) => {
          sectionRefs.current["closing-cta"] = node;
        }} nativeID="closing-cta" style={styles.section}>
        <Text style={styles.sectionTitle}>Closing CTA</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Closing CTA.</Text>
        <Pressable onPress={goToAuth} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Coba Gratis</Text>
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
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.mutedText,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  linkButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.mutedText}33`,
  },
  linkText: {
    fontSize: typography.small,
    color: colors.text,
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
