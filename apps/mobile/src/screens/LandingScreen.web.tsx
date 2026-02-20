import React, { useEffect, useRef, useState } from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme/tokens";

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
const HERO_IMAGE = require("../../assets/image/landing-page/1.jpg");

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
    scrollRef.current?.scrollTo({ y: sectionOffsets.current[key], animated: true });
  };

  return (
    <ScrollView ref={scrollRef} style={styles.page} contentContainerStyle={styles.content}>
      <View
        nativeID="beranda"
        onLayout={(event) => {
          sectionOffsets.current.beranda = event.nativeEvent.layout.y;
        }}
        style={[styles.section, styles.headerSection]}
      >
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

      <View
        nativeID="hero"
        onLayout={(event) => {
          sectionOffsets.current.hero = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <View style={[styles.heroLayout, !isDesktop && styles.heroLayoutMobile]}>
          <View style={styles.heroTextColumn}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>Ritual Malam Harian</Text>
            </View>
            <Text style={styles.heroIntro}>Ruang tenang untuk menutup hari.</Text>
            <Text style={styles.heroTitle}>Tutup Hari dengan Lebih Tenang.</Text>
            <Text style={styles.heroSubheadline}>Untuk kamu yang lelah, tapi pikiran masih terus berjalan.</Text>
            <Text style={styles.heroDescription}>
              Ritual singkat dan terstruktur untuk membantu kamu perlahan melepaskan hari — tanpa iklan, tanpa scrolling,
              tanpa distraksi.
            </Text>
            <View style={styles.heroCtaRow}>
              <Pressable onPress={goToAuth} style={styles.ctaButton}>
                <Text style={styles.ctaText}>Mulai Ritual Malam Ini</Text>
              </Pressable>
              <Pressable onPress={() => goToSection("cara-kerja")} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Pelajari Cara Kerjanya</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroImageCard}>
            <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>
      </View>

      <View
        nativeID="untuk-siapa"
        onLayout={(event) => {
          sectionOffsets.current["untuk-siapa"] = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Malam seharusnya jadi waktu beristirahat.</Text>
        <Text style={styles.sectionBody}>
          Tapi sering kali, justru di malam hari pikiran terasa paling bising.
Tubuh ingin tidur, tapi hati dan kepala belum selesai.
        </Text>

        <View style={[styles.calmCardsRow, !isDesktop && styles.calmCardsColumn]}>
          <View style={styles.calmCard}>
            <Text style={styles.calmCardText}>Hari terasa belum benar-benar selesai.</Text>
          </View>
          <View style={styles.calmCard}>
            <Text style={styles.calmCardText}>Pikiran mengulang percakapan dan keputusan.</Text>
          </View>
          <View style={styles.calmCard}>
            <Text style={styles.calmCardText}>Kamu ingin tenang, tapi tidak tahu mulai dari mana.</Text>
          </View>
        </View>
      </View>

      <View
        nativeID="cara-kerja"
        onLayout={(event) => {
          sectionOffsets.current["cara-kerja"] = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Cara Kerja</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Cara Kerja.</Text>
      </View>

      <View
        nativeID="manfaat"
        onLayout={(event) => {
          sectionOffsets.current.manfaat = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Manfaat</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Manfaat.</Text>
      </View>

      <View
        nativeID="diferensiasi"
        onLayout={(event) => {
          sectionOffsets.current.diferensiasi = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Diferensiasi</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Diferensiasi.</Text>
      </View>

      <View
        nativeID="trust"
        onLayout={(event) => {
          sectionOffsets.current.trust = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Trust</Text>
        <Text style={styles.sectionBody}>Placeholder konten section Trust.</Text>
      </View>

      <View
        nativeID="faq"
        onLayout={(event) => {
          sectionOffsets.current.faq = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>FAQ</Text>
        <Text style={styles.sectionBody}>Placeholder konten section FAQ.</Text>
      </View>

      <View
        nativeID="closing-cta"
        onLayout={(event) => {
          sectionOffsets.current["closing-cta"] = event.nativeEvent.layout.y;
        }}
        style={styles.section}
      >
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
  heroLayout: {
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "stretch",
  },
  heroLayoutMobile: {
    flexDirection: "column",
  },
  heroTextColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  badgePill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.primary}14`,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },
  heroIntro: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubheadline: {
    fontSize: typography.title,
    lineHeight: 26,
    color: colors.text,
    fontWeight: "600",
  },
  heroDescription: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.mutedText,
    maxWidth: 620,
  },
  heroCtaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  heroImageCard: {
    flex: 1,
    minHeight: 420,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
    boxShadow: `0px 10px 30px ${colors.text}1F`,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },

  calmCardsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  calmCardsColumn: {
    flexDirection: "column",
  },
  calmCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 16px ${colors.text}12`,
  },
  calmCardText: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.text,
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
    borderRadius: radius.sm,
  },
  ctaText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}44`,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
});
