import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminAudioSummary } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

type Props = {
  rows: AdminAudioSummary[];
};

export default function AdminAudioSummaryPanel({ rows }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.audioTableTitle}</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyState}>{id.admin.noData}</Text>
      ) : (
        rows.map((row) => (
          <View style={styles.tableRow} key={row.audio_id}>
            <View style={styles.tableLabelWrap}>
              <Text style={styles.tableTitle}>{row.audio_id}</Text>
              <Text style={styles.tableMeta}>{`${row.plays} plays · ${row.completes} complete · ${row.derived_abandons} abandon`}</Text>
            </View>
            <Text style={styles.tableValue}>{percent(row.completion_rate)}</Text>
          </View>
        ))
      )}
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
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
  },
  tableLabelWrap: {
    gap: 2,
    flex: 1,
  },
  tableTitle: {
    color: colors.text,
    fontSize: typography.body,
  },
  tableMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  tableValue: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.body,
  },
  emptyState: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
});
