import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminTailoredSessionRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminTailoredSessionRow[];
  homeSleepClicks: number;
};

const SESSION_LABELS: Record<AdminTailoredSessionRow["session_mode"], string> = {
  calm_mind: id.admin.tailoredCalmMindLabel,
  release_accept: id.admin.tailoredReleaseAcceptLabel,
};

export default function AdminTailoredSessionsPanel({ rows, homeSleepClicks }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.tailoredUsageTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.tailoredUsageSubtitle}</Text>

      <View style={styles.startSleepCard}>
        <Text style={styles.startSleepLabel}>{id.admin.homeSleepClickLabel}</Text>
        <Text style={styles.startSleepValue}>{homeSleepClicks}</Text>
      </View>

      {rows.map((row) => (
        <View key={row.session_mode} style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>{SESSION_LABELS[row.session_mode]}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{id.admin.tailoredSelectionsLabel}</Text>
              <Text style={styles.statValue}>{row.selections}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{id.admin.tailoredStartsLabel}</Text>
              <Text style={styles.statValue}>{row.starts}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{id.admin.tailoredCompletesLabel}</Text>
              <Text style={styles.statValue}>{row.completes}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  panelTitle: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.title,
  },
  panelSubtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  sessionCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  startSleepCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  startSleepLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  startSleepValue: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "700",
  },
  sessionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  statItem: {
    minWidth: 100,
    gap: spacing.xs,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "700",
  },
});
