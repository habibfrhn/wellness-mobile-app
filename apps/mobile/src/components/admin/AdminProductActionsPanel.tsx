import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminProductActions } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  actions: AdminProductActions | null;
};

export default function AdminProductActionsPanel({ actions }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.productSignalsTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.productSignalsSubtitle}</Text>

      <View style={styles.metricCard}>
        <Text style={styles.label}>{id.admin.homeSleepClickLabel}</Text>
        <Text style={styles.value}>{actions?.home_sleep_clicks ?? 0}</Text>
      </View>
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
  metricCard: {
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.bg,
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
  },
  value: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "700",
  },
});
