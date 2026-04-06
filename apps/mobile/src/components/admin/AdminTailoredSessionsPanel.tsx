import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminTailoredSessionRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminTailoredSessionRow[];
};

const SESSION_LABELS: Record<AdminTailoredSessionRow["session_mode"], string> = {
  calm_mind: id.admin.tailoredCalmMindLabel,
  release_accept: id.admin.tailoredReleaseAcceptLabel,
};

export default function AdminTailoredSessionsPanel({ rows }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.tailoredUsageTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.tailoredUsageSubtitle}</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.modeCell]}>{id.admin.tailoredSessionModeLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.tailoredSelectionsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.tailoredStartsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.tailoredCompletesLabel}</Text>
      </View>

      {rows.map((row) => (
        <View key={row.session_mode} style={styles.tableRow}>
          <Text style={[styles.valueCell, styles.modeCell]}>{SESSION_LABELS[row.session_mode]}</Text>
          <Text style={styles.valueCell}>{row.selections}</Text>
          <Text style={styles.valueCell}>{row.starts}</Text>
          <Text style={styles.valueCell}>{row.completes}</Text>
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
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
    paddingBottom: spacing.sm,
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
    paddingVertical: spacing.sm,
  },
  valueCell: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
  },
  modeCell: {
    flex: 2,
  },
});
