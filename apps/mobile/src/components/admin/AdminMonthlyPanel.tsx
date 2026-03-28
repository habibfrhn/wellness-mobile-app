import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminMonthlyRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminMonthlyRow[];
};

function monthLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function AdminMonthlyPanel({ rows }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.monthly12mTitle}</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyState}>{id.admin.noData}</Text>
      ) : (
        rows.map((row) => (
          <Text key={row.month_start} style={styles.rowText}>
            {`${monthLabel(row.month_start)} · plays ${row.audio_plays} · signup ${row.signup_completes} · tailored ${row.tailored_completes}`}
          </Text>
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
    gap: spacing.xs,
  },
  panelTitle: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.title,
  },
  rowText: {
    color: colors.text,
    fontSize: typography.small,
  },
  emptyState: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
});
