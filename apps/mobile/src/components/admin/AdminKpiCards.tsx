import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminKpis } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

type Props = {
  kpis: AdminKpis | null;
};

export default function AdminKpiCards({ kpis }: Props) {
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{id.admin.totalAudioPlays}</Text>
        <Text style={styles.cardValue}>{kpis?.total_audio_plays ?? 0}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{id.admin.tailoredCompletion}</Text>
        <Text style={styles.cardValue}>{percent(kpis?.tailored_completion_rate ?? 0)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{id.admin.funnelSignupConversion}</Text>
        <Text style={styles.cardValue}>{percent(kpis?.signup_conversion_rate ?? 0)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{id.admin.audioCompletionVsAbandonment}</Text>
        <Text style={styles.cardValue}>{`${kpis?.audio_completes ?? 0} / ${kpis?.audio_abandons ?? 0}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    minWidth: 190,
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  cardValue: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.h2,
  },
});
