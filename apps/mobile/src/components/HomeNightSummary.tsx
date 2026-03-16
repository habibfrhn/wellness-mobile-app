import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

const DAILY_QUOTES = [
  "Tidak apa-apa jika hari ini terasa berat. Malam ini waktunya beristirahat.",
  "Tubuhmu tahu kapan harus berhenti. Dengarkan pelan-pelan.",
  "Malam adalah tempat untuk melepas, bukan memikirkan ulang.",
  "Biarkan hari ini selesai di sini.",
  "Pikiran bisa menunggu. Istirahat tidak.",
  "Tidak semua harus selesai hari ini.",
  "Tarik napas, perlambat langkahmu.",
  "Kamu sudah melakukan cukup hari ini.",
  "Dunia bisa berjalan tanpa kamu semalaman.",
  "Tidur bukan kemewahan, tapi kebutuhan.",
  "Hening malam membantu yang lelah pulih.",
  "Lepaskan sedikit demi sedikit.",
  "Tidak perlu kuat sepanjang waktu.",
  "Malam memberi ruang untuk kembali utuh.",
  "Tenang bukan berarti lemah.",
  "Istirahat adalah bagian dari bergerak maju.",
  "Tubuhmu bekerja keras hari ini.",
  "Tidak apa jika kamu berhenti sebentar.",
  "Gelap bukan menakutkan, hanya lebih sunyi.",
  "Biarkan pikiran melambat bersama malam.",
  "Kamu tidak harus memikirkan semuanya sekarang.",
  "Ada hari baru setelah ini.",
  "Pelan bukan berarti tertinggal.",
  "Tidur adalah bentuk kepercayaan.",
  "Malam membantu kita memulai ulang.",
  "Tidak semua hal perlu jawaban malam ini.",
  "Keheningan juga bisa menenangkan.",
  "Biarkan tubuhmu memimpin sekarang.",
  "Kamu sudah cukup hari ini.",
  "Waktu istirahat juga bagian dari hidup.",
] as const;

type Props = {
  streakCount: number;
  lastNightStressDelta?: number | null;
  onPressPrimary: () => void;
};

function getDailyQuote(): string {
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const hash = dateKey.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DAILY_QUOTES[hash % DAILY_QUOTES.length];
}

export default function HomeNightSummary({
  streakCount,
  lastNightStressDelta = null,
  onPressPrimary,
}: Props) {
  const streakText = id.home.streakRoutine.replace("{count}", String(streakCount));
  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const stressText =
    typeof lastNightStressDelta === "number"
      ? id.home.lastNightStressDelta.replace("{delta}", formatStressDelta(lastNightStressDelta))
      : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.primaryCardTitle}</Text>
      <Text style={styles.subtitle}>{dailyQuote}</Text>

      {streakCount >= 1 ? <Text style={styles.streak}>{streakText}</Text> : null}
      {stressText ? <Text style={styles.lastNight}>{stressText}</Text> : null}

      <Pressable onPress={onPressPrimary} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>
    </View>
  );
}

function formatStressDelta(delta: number): string {
  if (delta === 0) {
    return id.home.stressDeltaSteady;
  }

  if (delta > 0) {
    return id.home.stressDeltaDown.replace("{amount}", String(delta));
  }

  return id.home.stressDeltaUp.replace("{amount}", String(Math.abs(delta)));
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  streak: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  lastNight: {
    color: colors.mutedText,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
});
