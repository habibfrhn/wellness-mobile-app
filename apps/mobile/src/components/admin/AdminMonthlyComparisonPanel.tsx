import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminMonthlyComparisonRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminMonthlyComparisonRow[];
};

function formatMonth(monthStart: string) {
  const date = new Date(monthStart);
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date);
}

export default function AdminMonthlyComparisonPanel({ rows }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.monthlyComparisonTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.monthlyComparisonSubtitle}</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.monthCell]}>{id.admin.monthLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.monthlyHomeSleepLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.monthlyAudioStartsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.monthlyAudioCompletesLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.monthlyTailoredStartsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.monthlyTailoredCompletesLabel}</Text>
      </View>

      {rows.map((row) => (
        <View key={row.month_start} style={styles.tableRow}>
          <Text style={[styles.valueCell, styles.monthCell]}>{formatMonth(row.month_start)}</Text>
          <Text style={styles.valueCell}>{row.home_sleep_clicks}</Text>
          <Text style={styles.valueCell}>{row.audio_starts}</Text>
          <Text style={styles.valueCell}>{row.audio_completes}</Text>
          <Text style={styles.valueCell}>{row.tailored_starts}</Text>
          <Text style={styles.valueCell}>{row.tailored_completes}</Text>
        </View>
      ))}

      {rows.length === 0 ? <Text style={styles.emptyText}>{id.admin.noData}</Text> : null}
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
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
    paddingBottom: spacing.xs,
  },
  headerCell: {
    flex: 1,
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
    paddingVertical: spacing.xs,
  },
  valueCell: {
    flex: 1,
    color: colors.text,
    fontSize: typography.caption,
  },
  monthCell: {
    flex: 1.5,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.small,
    paddingVertical: spacing.sm,
  },
});
