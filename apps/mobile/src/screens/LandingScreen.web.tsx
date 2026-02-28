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
const EMPATHY_IMAGE_FOUR = require("../../assets/image/landing-page/4.jpg");
const BENEFITS_IMAGE = require("../../assets/image/landing-page/8.jpg");
const RITUAL_IMAGE_ONE = require("../../assets/image/landing-page/11.jpg");
const RITUAL_IMAGE_TWO = require("../../assets/image/landing-page/7.jpg");
const TRUST_IMAGE = require("../../assets/image/landing-page/9.jpg");
const CLOSING_CTA_IMAGE = require("../../assets/image/landing-page/10.jpg");
const HERO_GAP = 20;
const HERO_IMAGE_RATIO = 4 / 5;
const BUTTON_PADDING_VERTICAL_DESKTOP = 12;
const BUTTON_PADDING_HORIZONTAL_DESKTOP = 20;
const BUTTON_PADDING_VERTICAL_MOBILE = 10;
const BUTTON_PADDING_HORIZONTAL_MOBILE = 18;
const BUTTON_BORDER_RADIUS = 10;
const SECTION_PAD_Y_DESKTOP = 56;
const SECTION_PAD_Y_MOBILE = 36;
const GAP_TITLE_TO_CONTENT_MOBILE = 16;
const GAP_TITLE_TO_CONTENT_DESKTOP = 24;
const SECTION_GAP = 0;
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
      <View style={[styles.mainContent, isDesktop && styles.mainContentDesktop]}>
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
          <Pressable onPress={goToAuth} style={[styles.landingButtonBase, styles.landingButtonPrimary, isDesktop ? styles.landingButtonSizeDesktop : styles.landingButtonSizeMobile, isDesktop && styles.headerPrimaryButtonCompact]}>
            <Text style={styles.landingButtonPrimaryText}>Buat akun</Text>
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
            <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop, styles.heroTitleSpacing, isDesktop && styles.heroTitleSpacingDesktop]}>Tutup hari dengan lebih tenang</Text>
            <Text style={styles.heroBodyCopy}>Untuk kamu yang lelah, tapi pikiran masih terus berjalan.</Text>
            <View style={[styles.heroCtaRow, styles.heroCtaRowBreathing, isDesktop && styles.heroCtaRowDesktop]}>
              <Pressable onPress={goToAuth} style={[styles.landingButtonBase, styles.landingButtonPrimary, isDesktop ? styles.landingButtonSizeDesktop : styles.landingButtonSizeMobile]}>
                <Text style={styles.landingButtonPrimaryText}>Mulai gratis</Text>
              </Pressable>
              <Pressable onPress={() => setIsFoundingOpen(true)} style={[styles.landingButtonBase, styles.landingButtonSecondary, isDesktop ? styles.landingButtonSizeDesktop : styles.landingButtonSizeMobile]}>
                <Text style={styles.landingButtonSecondaryText}>Jadi founding member</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroImageCard, isDesktop && styles.heroImageCardDesktop]}>
            <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>
      </View>

      <View style={styles.empathySectionOuter}>
        <View
          nativeID="untuk-siapa"
          onLayout={(event) => {
            sectionOffsets.current["untuk-siapa"] = event.nativeEvent.layout.y;
          }}
          style={[styles.empathySectionInner, isDesktop && styles.empathySectionInnerDesktop]}
        >
          <Text
            style={[
              styles.sectionTitle,
              isDesktop && styles.sectionTitleDesktop,
              styles.sectionTitleCentered,
              styles.empathySectionTitle,
              styles.sectionTitleToContentGap,
              isDesktop && styles.sectionTitleToContentGapDesktop,
            ]}
          >
            Malam seharusnya jadi waktu beristirahat
          </Text>

          <View style={[styles.calmCardsRow, !isDesktop && styles.calmCardsColumn]}>
            <View style={styles.calmCard}>
              <Image source={EMPATHY_IMAGE_ONE} style={styles.calmCardImage} resizeMode="cover" />
              <View style={styles.calmCardBody}>
                <Text style={[styles.calmCardText, styles.empathyCardText]}>Seolah hari belum benar-benar berakhir.</Text>
              </View>
            </View>
            <View style={styles.calmCard}>
              <Image source={EMPATHY_IMAGE_TWO} style={styles.calmCardImage} resizeMode="cover" />
              <View style={styles.calmCardBody}>
                <Text style={[styles.calmCardText, styles.empathyCardText]}>
                  Pikiran terus mengulang percakapan dan keputusan yang sudah lewat.
                </Text>
              </View>
            </View>
            <View style={styles.calmCard}>
              <Image source={EMPATHY_IMAGE_THREE} style={styles.calmCardImage} resizeMode="cover" />
              <View style={styles.calmCardBody}>
                <Text style={[styles.calmCardText, styles.empathyCardText]}>Kamu ingin tenang, tapi tidak tahu mulai dari mana.</Text>
              </View>
            </View>
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
        <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop, styles.processTitleSpacing, isDesktop && styles.processTitleSpacingDesktop]}>
          Alur malam yang menenangkan
        </Text>

        <View style={[styles.processLayout, isDesktop ? styles.processLayoutDesktop : styles.processLayoutMobile]}>
          <View style={[styles.processImageCard, !isDesktop && styles.processImageCardMobile, isDesktop && styles.processImageCardDesktop]}>
            <Image source={EMPATHY_IMAGE_FOUR} style={styles.heroImage} resizeMode="cover" />
          </View>

          <View style={[styles.processContentColumn, isDesktop && styles.processContentColumnDesktop]}>
            <View style={styles.processStepsStack}>
              <View style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
                <Text style={styles.stepTitle}>1) Pilih Mode Malam Ini</Text>
                <Text style={styles.stepBody}>Tenangkan pikiran atau lepaskan beban hari.</Text>
              </View>

              <View style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
                <Text style={styles.stepTitle}>2) Ikuti Alur Terpandu</Text>
                <Text style={styles.stepBody}>Tanpa perlu memilih lagi. Tanpa perlu berpikir lagi.</Text>
              </View>

              <View style={styles.stepCardWithNote}>
                <View style={[styles.stepCard, isDesktop && styles.stepCardDesktop]}>
                  <Text style={styles.stepTitle}>3) Biarkan Malam Bekerja</Text>
                  <Text style={styles.stepBody}>Masuk tidur dengan lebih pelan dan stabil.</Text>
                </View>
                <Text style={styles.stepNote}>Total waktu sekitar 15 menit.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View
        nativeID="manfaat"
        onLayout={(event) => {
          sectionOffsets.current.manfaat = event.nativeEvent.layout.y;
        }}
        style={[styles.section, isDesktop && styles.sectionDesktop]}
      >
        <View style={[styles.benefitsLayout, isDesktop ? styles.benefitsLayoutDesktop : styles.benefitsLayoutMobile]}>
          <View style={[styles.benefitsTextColumn, isDesktop && styles.benefitsTextColumnDesktop]}>
            <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop, styles.benefitsTitle]}>Yang kamu rasakan</Text>
            <Text style={styles.benefitsBody}>
              Pelan pelan pikiran mulai melambat dan tubuh lebih siap untuk tidur. Tidur terasa lebih dalam dan bangun lebih ringan. Kamu punya ruang untuk menutup hari dengan sadar.
            </Text>
          </View>

          <View style={[styles.benefitsImageCard, isDesktop && styles.benefitsImageCardDesktop]}>
            <Image source={BENEFITS_IMAGE} style={styles.heroImage} resizeMode="cover" />
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
        <View style={[styles.ritualHeading, isDesktop && styles.ritualHeadingDesktop]}>
          <Text
            style={[
              styles.sectionTitle,
              isDesktop && styles.sectionTitleDesktop,
              styles.ritualSectionTitle,
              isDesktop && styles.ritualSectionTitleDesktop,
            ]}
          >
            Bukan konten. Sebuah kebiasaan.
          </Text>
        </View>

        <View style={styles.ritualGrid}>
          <View style={[styles.ritualCard, isDesktop && styles.ritualGridCardDesktop]}>
            <Text style={styles.ritualCardTitle}>Yang sering terjadi</Text>
            <View style={styles.ritualCardLines}>
              <Text style={styles.ritualCardItem}>Kebanyakan pilihan</Text>
              <Text style={styles.ritualCardItem}>Mudah terdistraksi</Text>
              <Text style={styles.ritualCardItem}>Akhirnya tetap scrolling</Text>
            </View>
          </View>

          <View style={[styles.ritualImageCard, isDesktop && styles.ritualGridCardDesktop]}>
            <Image source={RITUAL_IMAGE_ONE} style={styles.ritualImage} resizeMode="cover" />
          </View>

          <View style={[styles.ritualImageCard, isDesktop && styles.ritualGridCardDesktop]}>
            <Image source={RITUAL_IMAGE_TWO} style={styles.ritualImage} resizeMode="cover" />
          </View>

          <View style={[styles.ritualCard, isDesktop && styles.ritualGridCardDesktop]}>
            <Text style={styles.ritualCardTitle}>Dengan Lumepo</Text>
            <View style={styles.ritualCardLines}>
              <Text style={styles.ritualCardItem}>Mulai dengan satu tombol</Text>
              <Text style={styles.ritualCardItem}>Tinggal ikuti langkahnya</Text>
              <Text style={styles.ritualCardItem}>Punya ruang untuk tenang</Text>
            </View>
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
        <View style={[styles.trustLayout, isDesktop ? styles.trustLayoutDesktop : styles.trustLayoutMobile]}>
          <View style={[styles.trustTextColumn, isDesktop && styles.trustTextColumnDesktop]}>
            <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop, styles.trustTitle]}>
              Dibuat dari Pengalaman Nyata
            </Text>
            <Text style={styles.trustBody}>
              Aplikasi ini lahir dari seseorang yang juga sering merasa sulit mematikan pikiran di malam hari. Bukan tentang menjadi lebih produktif, tapi tentang memberi diri sendiri ruang untuk berhenti.
            </Text>
          </View>

          <View style={[styles.trustImageCard, isDesktop && styles.trustImageCardDesktop]}>
            <Image source={TRUST_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>
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
        <View style={[styles.closingCtaLayout, isDesktop ? styles.closingCtaLayoutDesktop : styles.closingCtaLayoutMobile]}>
          <View style={[styles.closingCtaTextColumn, isDesktop && styles.closingCtaTextColumnDesktop]}>
            <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop, styles.closingCtaTitleSpacing, isDesktop && styles.closingCtaTitleSpacingDesktop]}>Malam Ini, Kamu Bisa Memulainya</Text>
            <Text style={styles.closingCtaSubtext}>Cukup 15 menit sebelum tidur.</Text>
            <Pressable onPress={goToAuth} style={[styles.landingButtonBase, styles.landingButtonPrimary, isDesktop ? styles.landingButtonSizeDesktop : styles.landingButtonSizeMobile, styles.closingCtaButton]}>
              <Text style={styles.landingButtonPrimaryText}>Mulai Gratis</Text>
            </Pressable>
            <Text style={styles.closingCtaMicrocopy}>Tanpa kartu kredit.</Text>
          </View>

          <View style={[styles.closingCtaImageCard, isDesktop && styles.closingCtaImageCardDesktop]}>
            <Image source={CLOSING_CTA_IMAGE} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>
      </View>
      </View>

      <View style={styles.footerSection}>
        <View style={[styles.footerContent, isDesktop && styles.footerContentDesktop]}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerBrandTitle}>Lumepo</Text>
            <Text style={styles.footerDescription}>Ruang tenang untuk menutup hari dengan sadar.</Text>
            <Text style={styles.footerCopyright}>© 2025 Lumepo. Semua hak dilindungi.</Text>
          </View>

          <View style={styles.footerColumn}>
            <Text style={styles.footerHeading}>Navigasi</Text>
            <Pressable onPress={() => goToSection("beranda")} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>Beranda</Text>
            </Pressable>
            <Pressable onPress={() => goToSection("untuk-siapa")} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>Untuk Siapa</Text>
            </Pressable>
            <Pressable onPress={() => goToSection("manfaat")} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>Manfaat</Text>
            </Pressable>
            <Pressable onPress={() => goToSection("faq")} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>FAQ</Text>
            </Pressable>
          </View>

          <View style={styles.footerColumn}>
            <Text style={styles.footerHeading}>Informasi</Text>
            <Pressable onPress={() => {}} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>Kebijakan Privasi</Text>
            </Pressable>
            <Pressable onPress={() => {}} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>Syarat & Ketentuan</Text>
            </Pressable>
            <Pressable onPress={() => {}} style={({ hovered }: any) => [styles.footerLinkPressable, hovered && styles.footerLinkPressableHover]}>
              <Text style={styles.footerLinkText}>Kontak</Text>
            </Pressable>
            <Text style={styles.footerContact}>hello@lumepo.id</Text>
          </View>
        </View>
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
                <Pressable
                  onPress={submitFounding}
                  style={[
                    styles.landingButtonBase,
                    styles.landingButtonPrimary,
                    isDesktop ? styles.landingButtonSizeDesktop : styles.landingButtonSizeMobile,
                    styles.modalSubmitButton,
                  ]}
                >
                  <Text style={styles.landingButtonPrimaryText}>Saya ingin jadi Founding Member</Text>
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
    paddingTop: SECTION_PAD_Y_MOBILE,
    paddingBottom: 0,
    gap: SECTION_GAP,
  },
  contentDesktop: {
    paddingTop: SECTION_PAD_Y_DESKTOP,
    paddingBottom: 0,
    gap: SECTION_GAP,
  },
  mainContent: {
    width: "100%",
    paddingHorizontal: spacing.lg,
  },
  mainContentDesktop: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    width: "100%",
    maxWidth: 1100,
    marginHorizontal: "auto",
    paddingHorizontal: spacing.lg,
    paddingVertical: SECTION_PAD_Y_MOBILE,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  sectionDesktop: {
    paddingHorizontal: spacing.lg,
    paddingVertical: SECTION_PAD_Y_DESKTOP,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerSectionDesktop: {
    paddingTop: 4,
    paddingBottom: 4,
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
  headerPrimaryButtonCompact: {
    paddingVertical: 10,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 32,
    marginBottom: 0,
  },
  heroSectionDesktop: {
    paddingTop: 60,
    paddingBottom: 40,
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
    flex: 1,
    justifyContent: "center",
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
  heroTitleSpacing: {
    marginBottom: GAP_TITLE_TO_CONTENT_MOBILE,
  },
  heroTitleSpacingDesktop: {
    marginBottom: GAP_TITLE_TO_CONTENT_DESKTOP,
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
    aspectRatio: HERO_IMAGE_RATIO,
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

  empathySectionOuter: {
    width: "100%",
    backgroundColor: colors.white,
  },
  empathySectionInner: {
    width: "100%",
    maxWidth: 1100,
    marginHorizontal: "auto",
    paddingHorizontal: 24,
    paddingVertical: SECTION_PAD_Y_MOBILE,
    gap: 0,
  },
  empathySectionInnerDesktop: {
    paddingVertical: SECTION_PAD_Y_DESKTOP,
  },
  empathySectionTitle: {
    color: "#111111",
  },
  empathyCardText: {
    color: "#1C1C1C",
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
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  calmCardImage: {
    width: "100%",
    height: 156,
  },
  calmCardBody: {
    padding: 20,
  },
  calmCardText: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.text,
    textAlign: "center",
  },

  processLayout: {
    width: "100%",
    gap: spacing.md,
  },
  processLayoutDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  processLayoutMobile: {
    flexDirection: "column",
  },
  processContentColumn: {
    width: "100%",
  },
  processContentColumnDesktop: {
    flex: 1,
    justifyContent: "center",
    flexBasis: "45%",
  },
  processTitleSpacing: {
    marginBottom: GAP_TITLE_TO_CONTENT_MOBILE,
    textAlign: "left",
  },
  processTitleSpacingDesktop: {
    marginBottom: GAP_TITLE_TO_CONTENT_DESKTOP,
  },
  processStepsStack: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.sm,
  },
  stepCardWithNote: {
    gap: 6,
  },

  stepsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepsColumn: {
    flexDirection: "column",
  },
  stepCard: {
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    boxShadow: `0px 4px 16px ${colors.text}12`,
    gap: 6,
  },
  stepTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  stepCardDesktop: {
    minHeight: 80,
  },
  stepBody: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.mutedText,
  },
  stepNote: {
    alignSelf: "flex-end",
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "500",
  },

  benefitsLayout: {
    width: "100%",
    gap: spacing.md,
  },
  benefitsLayoutDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  benefitsLayoutMobile: {
    flexDirection: "column",
  },
  benefitsTextColumn: {
    width: "100%",
    justifyContent: "center",
  },
  benefitsTextColumnDesktop: {
    flex: 1,
  },
  benefitsTitle: {
    textAlign: "left",
    marginBottom: spacing.sm,
  },
  benefitsBody: {
    fontSize: typography.body,
    lineHeight: 30,
    color: colors.mutedText,
  },
  benefitsImageCard: {
    width: "100%",
    aspectRatio: HERO_IMAGE_RATIO,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  benefitsImageCardDesktop: {
    flex: 1,
    maxWidth: 460,
  },

  processImageCard: {
    width: "100%",
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  processImageCardMobile: {
    aspectRatio: 16 / 9,
  },
  processImageCardDesktop: {
    flex: 1.2,
    flexBasis: "55%",
    width: "100%",
    height: 340,
    maxWidth: 640,
  },

  ritualHeading: {
    marginBottom: GAP_TITLE_TO_CONTENT_MOBILE,
  },
  ritualHeadingDesktop: {
    marginBottom: GAP_TITLE_TO_CONTENT_DESKTOP,
  },
  ritualSectionTitle: {
    textAlign: "left",
  },
  ritualSectionTitleDesktop: {
    fontSize: 32,
    lineHeight: 40,
  },
  ritualGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  ritualCard: {
    width: "100%",
    aspectRatio: 16 / 9,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.mutedText}2E`,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    justifyContent: "center",
    gap: 0,
  },
  ritualGridCardDesktop: {
    flexBasis: "49%",
    maxWidth: "49%",
  },
  ritualImageCard: {
    width: "100%",
    aspectRatio: 16 / 9,
    padding: 0,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ritualImage: {
    width: "100%",
    height: "100%",
  },
  ritualCardTitle: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  ritualCardLines: {
    gap: 4,
  },
  ritualCardItem: {
    fontSize: 16,
    color: "rgba(0,0,0,0.7)",
    lineHeight: 21,
    fontWeight: "400",
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
  sectionTitleToContentGap: {
    marginBottom: GAP_TITLE_TO_CONTENT_MOBILE,
  },
  sectionTitleToContentGapDesktop: {
    marginBottom: GAP_TITLE_TO_CONTENT_DESKTOP,
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
  trustLayout: {
    width: "100%",
    gap: spacing.md,
  },
  trustLayoutDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  trustLayoutMobile: {
    flexDirection: "column",
  },
  trustTextColumn: {
    width: "100%",
    justifyContent: "center",
  },
  trustTextColumnDesktop: {
    flex: 1,
  },
  trustTitle: {
    textAlign: "left",
    marginBottom: spacing.sm,
  },
  trustImageCard: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.white,
    padding: 0,
  },
  trustImageCardDesktop: {
    flex: 1,
    maxWidth: 460,
  },
  closingCtaSection: {
    alignItems: "stretch",
  },
  closingCtaLayout: {
    width: "100%",
    alignItems: "center",
    gap: spacing.lg,
  },
  closingCtaLayoutDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
  },
  closingCtaLayoutMobile: {
    flexDirection: "column",
  },
  closingCtaTextColumn: {
    width: "100%",
    gap: 0,
  },
  closingCtaTextColumnDesktop: {
    flex: 1,
    justifyContent: "center",
  },
  closingCtaImageCard: {
    width: "100%",
    aspectRatio: HERO_IMAGE_RATIO,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  closingCtaImageCardDesktop: {
    flex: 1,
  },
  closingCtaSubtext: {
    fontSize: typography.body,
    color: colors.mutedText,
    textAlign: "left",
    marginBottom: spacing.md,
  },
  closingCtaTitleSpacing: {
    marginBottom: GAP_TITLE_TO_CONTENT_MOBILE,
  },
  closingCtaTitleSpacingDesktop: {
    marginBottom: GAP_TITLE_TO_CONTENT_DESKTOP,
  },
  closingCtaButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  closingCtaMicrocopy: {
    fontSize: typography.caption,
    color: colors.mutedText,
    textAlign: "left",
  },
  landingButtonBase: {
    borderRadius: BUTTON_BORDER_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  landingButtonSizeDesktop: {
    paddingVertical: BUTTON_PADDING_VERTICAL_DESKTOP,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL_DESKTOP,
  },
  landingButtonSizeMobile: {
    paddingVertical: BUTTON_PADDING_VERTICAL_MOBILE,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL_MOBILE,
  },
  landingButtonPrimary: {
    backgroundColor: colors.primary,
  },
  landingButtonPrimaryText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  landingButtonSecondary: {
    borderWidth: 1,
    borderColor: `${colors.mutedText}44`,
    backgroundColor: colors.white,
  },
  landingButtonSecondaryText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },

  footerSection: {
    width: "100%",
    backgroundColor: "#21325E",
    marginTop: spacing.lg,
    marginBottom: 0,
    paddingBottom: 32,
  },
  footerContent: {
    width: "100%",
    maxWidth: 1100,
    marginHorizontal: "auto",
    paddingHorizontal: 24,
    paddingVertical: 28,
    flexDirection: "column",
    gap: spacing.lg,
  },
  footerContentDesktop: {
    paddingHorizontal: 24,
    paddingVertical: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 40,
  },
  footerColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  footerBrandTitle: {
    fontSize: typography.title,
    fontWeight: "800",
    color: colors.white,
  },
  footerDescription: {
    fontSize: typography.body,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
    maxWidth: 300,
  },
  footerCopyright: {
    fontSize: typography.caption,
    color: "rgba(255,255,255,0.7)",
    marginTop: spacing.xs,
  },
  footerHeading: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  footerLinkPressable: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    opacity: 0.85,
  },
  footerLinkPressableHover: {
    opacity: 1,
  },
  footerLinkText: {
    fontSize: typography.body,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
  },
  footerContact: {
    fontSize: typography.body,
    color: colors.white,
    marginTop: spacing.xs,
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
    width: "100%",
  },
  modalThanks: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
    fontWeight: "600",
  },
});
