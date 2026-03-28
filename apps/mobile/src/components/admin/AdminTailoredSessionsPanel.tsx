import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminTailoredSessionRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminTailoredSessionRow[];
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const SESSION_LABELS: Record<AdminTailoredSessionRow["session_mode"], string> = {
  calm_mind: id.admin.tailoredCalmMindLabel,
  release_accept: id.admin.tailoredReleaseAcceptLabel,
};

export default function AdminTailoredSessionsPanel({ rows }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.tailoredUsageTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.tailoredUsageSubtitle}</Text>

      {rows.map((row) => (
        <View key={row.session_mode} style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>{SESSION_LABELS[row.session_mode]}</Text>
          <Text style={styles.sessionMeta}>{`${id.admin.tailoredSelectionsLabel}: ${row.selections}`}</Text>
          <Text style={styles.sessionMeta}>{`${id.admin.tailoredStartsLabel}: ${row.starts}`}</Text>
          <Text style={styles.sessionMeta}>{`${id.admin.tailoredCompletesLabel}: ${row.completes}`}</Text>
          <Text style={styles.sessionMeta}>{`${id.admin.tailoredDropoffsLabel}: ${row.dropoffs}`}</Text>
          <Text style={styles.sessionRate}>{`${id.admin.tailoredCompletionRateLabel}: ${percent(row.completion_rate)}`}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
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
    padding: spacing.sm,
    gap: spacing.xs,
  },
  sessionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  sessionMeta: {
    color: colors.text,
    fontSize: typography.small,
  },
  sessionRate: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: "700",
  },
});
