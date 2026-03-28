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

      <View style={styles.row}>
        <Text style={styles.label}>{id.admin.homeSleepClickLabel}</Text>
        <Text style={styles.value}>{actions?.home_sleep_clicks ?? 0}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{id.admin.tailoredSelectionsTotalLabel}</Text>
        <Text style={styles.value}>{actions?.tailored_session_selections ?? 0}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{id.admin.tailoredStartsTotalLabel}</Text>
        <Text style={styles.value}>{actions?.tailored_session_starts ?? 0}</Text>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
  },
  value: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "700",
  },
});
