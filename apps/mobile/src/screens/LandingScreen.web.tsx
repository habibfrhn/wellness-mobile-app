import React, { useEffect, useRef, useState } from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme/tokens";
import useViewportWidth from "../hooks/useViewportWidth";
import WebResponsiveFrame from "../components/WebResponsiveFrame";

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
const EMPATHY_IMAGE_ONE = require("../../assets/image/landing-page/2.jpg");
const EMPATHY_IMAGE_TWO = require("../../assets/image/landing-page/3.jpg");
const EMPATHY_IMAGE_THREE = require("../../assets/image/landing-page/6.jpg");
const HERO_GAP = 20;
const TRACKED_SECTIONS: SectionKey[] = ["beranda", "untuk-siapa", "cara-kerja", "manfaat", "faq"];
const HEADER_NAV_ITEMS: Array<{ key: SectionKey; label: string }> = [
  { key: "beranda", label: "Beranda" },
  { key: "untuk-siapa", label: "Untuk Siapa" },
  { key: "manfaat", label: "Manfaat" },
  { key: "faq", label: "FAQ" },
];

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [isFoundingOpen, setIsFoundingOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("beranda");
  const viewportWidth = useViewportWidth();
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

  const isDesktop = viewportWidth > MOBILE_BREAKPOINT;

  const goToAuth = () => {
    navigation.navigate("Auth");
  };

  const goToSection = (key: SectionKey) => {
    scrollRef.current?.scrollTo({ y: sectionOffsets.current[key], animated: true });
  };

  const closeFoundingModal = () => {
    setIsFoundingOpen(false);
    setSubmitted(false);
    setEmail("");
  };

  const submitFounding = () => {
    if (email.includes("@")) {
      setSubmitted(true);
    }
  };

  useEffect(() => {
    const hasObserver = typeof window !== "undefined" && typeof IntersectionObserver !== "undefined";
    if (!hasObserver) {
      return;
    }

    const elements = TRACKED_SECTIONS.map((sectionKey) => ({
      sectionKey,
      element: document.getElementById(sectionKey),
    })).filter((item): item is { sectionKey: SectionKey; element: HTMLElement } => Boolean(item.element));

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
        if (!intersectingEntries.length) {
          return;
        }

        const focalPoint = window.innerHeight * 0.35;
        const nextEntry = intersectingEntries
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - focalPoint) - Math.abs(b.boundingClientRect.top - focalPoint),
          )[0];

        const nextSection = nextEntry.target.id as SectionKey;
        if (TRACKED_SECTIONS.includes(nextSection)) {
          setActiveSection(nextSection);
        }
      },
      {
        threshold: [0.3, 0.4, 0.6],
        rootMargin: "0px 0px -45% 0px",
      },
    );

    elements.forEach(({ element }) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <WebResponsiveFrame disableFrame>
      <ScrollView
        ref={scrollRef}
        style={styles.page}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        scrollEnabled={!isFoundingOpen}
      >
      <View
        nativeID="beranda"
        onLayout={(event) => {
          sectionOffsets.current.beranda = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop, styles.headerSection, isDesktop && styles.headerSectionDesktop]}
      >
        <Text style={styles.brand}>Lumepo</Text>

        {isDesktop ? (
          <View style={styles.headerDesktopNav}>
            {HEADER_NAV_ITEMS.map((item) => (
              <Pressable key={item.key} onPress={() => goToSection(item.key)} style={styles.navItem}>
                <Text style={styles.navText}>{item.label}</Text>
                <View style={[styles.navUnderline, activeSection === item.key && styles.navUnderlineActive, { transition: "opacity 180ms ease" } as any]} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View />
        )}

        <View style={styles.headerActions}>
          {isDesktop ? (
            <Pressable onPress={goToAuth} style={[styles.textButton, styles.headerTextButton]}>
              <Text style={styles.textButtonLabel}>Masuk</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={goToAuth} style={[styles.ctaButton, styles.headerPrimaryButton]}>
            <Text style={styles.ctaText}>Buat akun</Text>
          </Pressable>
        </View>
      </View>

      <View
        nativeID="hero"
        onLayout={(event) => {
          sectionOffsets.current.hero = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop, styles.heroSection, isDesktop && styles.heroSectionDesktop]}
      >
        <View style={[styles.heroLayout, isDesktop && styles.heroLayoutDesktop, !isDesktop && styles.heroLayoutMobile]}>
          <View style={[styles.heroTextColumn, isDesktop && styles.heroTextColumnDesktop]}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>Ruang tenang tiap malam</Text>
            </View>
            <Text style={[styles.heroTitle, styles.heroTitleSpacing, isDesktop && styles.heroTitleDesktop]}>Tutup hari dengan lebih tenang.</Text>
            <Text style={[styles.heroBodyCopy, styles.heroBodyCopySpacing]}>Untuk kamu yang lelah, tapi pikiran masih terus berjalan.</Text>
            <View style={[styles.heroCtaRow, styles.heroCtaRowBreathing, isDesktop && styles.heroCtaRowDesktop]}>
              <Pressable onPress={goToAuth} style={styles.ctaButton}>
                <Text style={styles.ctaText}>Mulai gratis</Text>
              </Pressable>
              <Pressable onPress={() => setIsFoundingOpen(true)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Jadi founding member</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroImageCard, isDesktop && styles.heroImageCardDesktop]}>
            <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>
      </View>

      <View
        nativeID="untuk-siapa"
        onLayout={(event) => {
          sectionOffsets.current["untuk-siapa"] = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop, styles.empathySection, isDesktop && styles.empathySectionDesktop]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop, styles.sectionTitleCentered, styles.empathySectionTitle]}>
          Malam seharusnya jadi waktu beristirahat.
        </Text>

        <View style={[styles.calmCardsRow, !isDesktop && styles.calmCardsColumn]}>
          <View style={styles.calmCard}>
            <Image source={EMPATHY_IMAGE_ONE} style={styles.calmCardImage} resizeMode="cover" />
            <Text style={[styles.calmCardText, styles.empathyCardText]}>Seolah hari belum benar-benar berakhir.</Text>
          </View>
          <View style={styles.calmCard}>
            <Image source={EMPATHY_IMAGE_TWO} style={styles.calmCardImage} resizeMode="cover" />
            <Text style={[styles.calmCardText, styles.empathyCardText]}>Pikiran terus mengulang percakapan dan keputusan yang sudah lewat.</Text>
          </View>
          <View style={styles.calmCard}>
            <Image source={EMPATHY_IMAGE_THREE} style={styles.calmCardImage} resizeMode="cover" />
            <Text style={[styles.calmCardText, styles.empathyCardText]}>Kamu ingin tenang, tapi tidak tahu mulai dari mana.</Text>
          </View>
        </View>
      </View>

      <View
        nativeID="cara-kerja"
        onLayout={(event) => {
          sectionOffsets.current["cara-kerja"] = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>Kamu Tidak Perlu Lebih Kuat. Kamu Hanya Perlu Sebuah Ritual.</Text>

        <View style={[styles.stepsRow, !isDesktop && styles.stepsColumn]}>
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>1) Pilih Mode Malam Ini</Text>
            <Text style={styles.stepBody}>Tenangkan pikiran atau lepaskan beban hari.</Text>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>2) Ikuti Alur Terpandu</Text>
            <Text style={styles.stepBody}>Tanpa perlu memilih lagi. Tanpa perlu berpikir lagi.</Text>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>3) Biarkan Malam Bekerja</Text>
            <Text style={styles.stepBody}>Masuk tidur dengan lebih pelan dan stabil.</Text>
          </View>
        </View>

        <Text style={styles.stepNote}>Total waktu sekitar 15 menit.</Text>
      </View>

      <View
        nativeID="manfaat"
        onLayout={(event) => {
          sectionOffsets.current.manfaat = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>Apa yang Berubah Setelah Beberapa Malam?</Text>

        <View style={[styles.benefitsGrid, !isDesktop && styles.benefitsGridMobile]}>
          <View style={[styles.benefitItem, isDesktop && styles.benefitItemDesktop]}>
            <Text style={styles.benefitText}>Pikiran lebih cepat melambat.</Text>
          </View>
          <View style={[styles.benefitItem, isDesktop && styles.benefitItemDesktop]}>
            <Text style={styles.benefitText}>Tidur terasa lebih dalam.</Text>
          </View>
          <View style={[styles.benefitItem, isDesktop && styles.benefitItemDesktop]}>
            <Text style={styles.benefitText}>Bangun dengan rasa yang lebih ringan.</Text>
          </View>
          <View style={[styles.benefitItem, isDesktop && styles.benefitItemDesktop]}>
            <Text style={styles.benefitText}>Tidak lagi bergantung pada video acak.</Text>
          </View>
          <View style={[styles.benefitItem, isDesktop && styles.benefitItemDesktop]}>
            <Text style={styles.benefitText}>Punya ruang kecil untuk menutup hari dengan sadar.</Text>
          </View>
        </View>
      </View>

      <View
        nativeID="diferensiasi"
        onLayout={(event) => {
          sectionOffsets.current.diferensiasi = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>Bukan Konten. Sebuah Ritual.</Text>

        <View style={[styles.ritualColumns, !isDesktop && styles.ritualColumnsMobile]}>
          <View style={styles.ritualCard}>
            <Text style={styles.ritualCardTitle}>Yang sering terjadi</Text>
            <Text style={styles.ritualCardItem}>• Banyak pilihan.</Text>
            <Text style={styles.ritualCardItem}>• Banyak distraksi.</Text>
            <Text style={styles.ritualCardItem}>• Mudah terbawa scrolling.</Text>
          </View>

          <View style={styles.ritualCard}>
            <Text style={styles.ritualCardTitle}>Dengan Lumepo</Text>
            <Text style={styles.ritualCardItem}>• Satu tombol.</Text>
            <Text style={styles.ritualCardItem}>• Satu alur.</Text>
            <Text style={styles.ritualCardItem}>• Satu ruang untuk tenang.</Text>
          </View>
        </View>
      </View>

      <View
        nativeID="trust"
        onLayout={(event) => {
          sectionOffsets.current.trust = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>Dibuat dari Pengalaman Nyata.</Text>
        <Text style={styles.trustBody}>
          Aplikasi ini lahir dari seseorang yang juga sering merasa sulit mematikan pikiran di malam hari.
{"\n"}
          Bukan tentang menjadi lebih produktif.
{"\n"}
          Tapi tentang memberi diri sendiri ruang untuk berhenti.
        </Text>
      </View>

      <View
        nativeID="faq"
        onLayout={(event) => {
          sectionOffsets.current.faq = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>FAQ</Text>

        <View style={styles.faqList}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Apakah ini cocok kalau saya sering overthinking?</Text>
            <Text style={styles.faqAnswer}>Ya. Ritual ini membantu pikiran melambat dengan alur yang lembut dan terarah.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Berapa lama durasinya?</Text>
            <Text style={styles.faqAnswer}>Sekitar 15 menit sebelum tidur.</Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Apakah perlu bayar?</Text>
            <Text style={styles.faqAnswer}>Kamu bisa mulai gratis di fase beta.</Text>
          </View>
        </View>
      </View>

      <View
        nativeID="closing-cta"
        onLayout={(event) => {
          sectionOffsets.current["closing-cta"] = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop, styles.closingCtaSection]}
      >
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>Malam Ini, Kamu Bisa Memulainya.</Text>
        <Text style={styles.closingCtaSubtext}>Cukup 15 menit sebelum tidur.</Text>
        <Pressable onPress={goToAuth} style={styles.ctaButton}>
          <Text style={styles.ctaText}>Mulai Gratis</Text>
        </Pressable>
        <Text style={styles.closingCtaMicrocopy}>Tanpa kartu kredit.</Text>
      </View>
      </ScrollView>

      {isFoundingOpen ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeFoundingModal} />
          <View style={styles.modalCard}>
            <Pressable onPress={closeFoundingModal} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>

            <Text style={styles.modalTitle}>Jadi Founding Member</Text>
            <Text style={styles.modalBody}>
              Kami membuka kesempatan untuk 100 orang pertama yang ingin mendukung pengembangan Lumepo.
              {"\n"}
              {"\n"}
              Sebagai Founding Member, kamu akan mendapatkan:
              {"\n"}• Akses seumur hidup saat aplikasi resmi diluncurkan.
              {"\n"}• Harga spesial sebagai pendukung awal.
              {"\n"}• Kesempatan memberi masukan langsung dalam pengembangan.
            </Text>
            <Text style={styles.modalNote}>Kontribusi awal kamu membantu kami menyelesaikan pengembangan aplikasi.</Text>

            {submitted ? (
              <Text style={styles.modalThanks}>Terima kasih. Kami akan menghubungi kamu segera.</Text>
            ) : (
              <>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Masukkan email kamu"
                  style={styles.modalInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Pressable onPress={submitFounding} style={styles.modalSubmitButton}>
                  <Text style={styles.modalSubmitText}>Saya ingin jadi Founding Member</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : null}
    </WebResponsiveFrame>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    minHeight: "100vh" as unknown as number,
    backgroundColor: colors.white,
  },
  content: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  contentDesktop: {
    paddingVertical: spacing.xl,
    gap: 0,
  },
  section: {
    width: "100%",
    maxWidth: 1100,
    marginHorizontal: "auto",
    paddingHorizontal: 0,
    paddingVertical: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  sectionDesktop: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 64,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerSectionDesktop: {
    paddingTop: 0,
    paddingBottom: 0,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  textButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTextButton: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
    marginVertical: 0,
  },
  textButtonLabel: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "700",
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 36,
  },
  heroSectionDesktop: {
    paddingTop: 56,
    paddingBottom: 56,
    minHeight: "75vh" as unknown as number,
  },
  heroLayout: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  heroLayoutDesktop: {
    alignItems: "center",
  },
  heroLayoutMobile: {
    flexDirection: "column",
  },
  heroTextColumn: {
    flex: 1,
    gap: 0,
  },
  heroTextColumnDesktop: {
    justifyContent: "center",
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
  heroTitleDesktop: {
    fontSize: 52,
    lineHeight: 60,
  },
  heroSubheadline: {
    fontSize: typography.title,
    lineHeight: 26,
    color: colors.text,
    fontWeight: "600",
  },
  heroSubheadlineDesktop: {
    fontSize: 24,
    lineHeight: 34,
  },
  heroDescription: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.mutedText,
    maxWidth: 620,
  },
  heroBodyCopy: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.mutedText,
    fontWeight: "400",
    maxWidth: 620,
  },
  heroTitleSpacing: {
    marginTop: HERO_GAP,
  },
  heroBodyCopySpacing: {
    marginTop: HERO_GAP,
  },
  heroDescriptionDesktop: {
    fontSize: typography.title,
    lineHeight: 32,
    maxWidth: 640,
  },
  heroCtaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  heroCtaRowBreathing: {
    marginTop: HERO_GAP,
  },
  heroCtaRowDesktop: {
    gap: spacing.md,
  },
  heroImageCard: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
    boxShadow: `0px 10px 30px ${colors.text}1F`,
  },
  heroImageCardDesktop: {
    flex: 1,
    maxWidth: 460,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },

  empathySection: {
    maxWidth: "100%",
    marginHorizontal: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: "#3E497A",
  },
  empathySectionDesktop: {
    paddingHorizontal: 48,
  },
  empathySectionTitle: {
    color: colors.white,
  },
  empathyCardText: {
    color: "rgba(255,255,255,0.9)",
  },
  calmCardsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  calmCardsColumn: {
    flexDirection: "column",
  },
  calmCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    gap: spacing.sm,
  },
  calmCardImage: {
    width: "100%",
    height: 156,
    borderRadius: 12,
  },
  calmCardText: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.text,
    textAlign: "center",
  },

  stepsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepsColumn: {
    flexDirection: "column",
  },
  stepCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 16px ${colors.text}12`,
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  stepBody: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.mutedText,
  },
  stepNote: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "600",
  },

  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.sm,
    rowGap: spacing.sm,
  },
  benefitsGridMobile: {
    flexDirection: "column",
  },
  benefitItem: {
    width: "100%",
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 16px ${colors.text}12`,
  },
  benefitItemDesktop: {
    width: "48%",
  },
  benefitText: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
  },

  ritualColumns: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ritualColumnsMobile: {
    flexDirection: "column",
  },
  ritualCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 16px ${colors.text}12`,
    gap: spacing.xs,
  },
  ritualCardTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ritualCardItem: {
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: 24,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 16px ${colors.text}12`,
    gap: spacing.xs,
  },
  faqQuestion: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 24,
  },
  faqAnswer: {
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
  },
  sectionTitleDesktop: {
    fontSize: 36,
    lineHeight: 44,
  },
  sectionTitleCentered: {
    textAlign: "center",
  },
  sectionBody: {
    fontSize: typography.body,
    color: colors.mutedText,
  },
  trustBody: {
    fontSize: typography.body,
    lineHeight: 28,
    color: colors.mutedText,
    maxWidth: 760,
  },
  closingCtaSection: {
    alignItems: "center",
  },
  closingCtaSubtext: {
    fontSize: typography.body,
    color: colors.mutedText,
    textAlign: "center",
  },
  closingCtaMicrocopy: {
    fontSize: typography.caption,
    color: colors.mutedText,
    textAlign: "center",
  },
  ctaButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  headerPrimaryButton: {
    height: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    marginVertical: 0,
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

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    padding: spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalCloseButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.mutedText,
    lineHeight: 24,
  },
  modalTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
  },
  modalBody: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.mutedText,
  },
  modalNote: {
    fontSize: typography.small,
    color: colors.mutedText,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 13,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.white,
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  modalThanks: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
    fontWeight: "600",
  },
});
