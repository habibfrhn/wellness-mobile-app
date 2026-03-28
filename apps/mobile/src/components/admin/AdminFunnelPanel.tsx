import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminFunnel } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  funnel: AdminFunnel | null;
};

export default function AdminFunnelPanel({ funnel }: Props) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.funnelTitle}</Text>
      {!funnel ? (
        <Text style={styles.emptyState}>{id.admin.noData}</Text>
      ) : (
        <>
          <Text style={styles.funnelRow}>{`1) ${id.admin.funnelPageView}: ${funnel.page_view_sessions}`}</Text>
          <Text style={styles.funnelRow}>{`2) ${id.admin.funnelCta}: ${funnel.cta_sessions}`}</Text>
          <Text style={styles.funnelRow}>{`3) ${id.admin.funnelSignupStart}: ${funnel.signup_start_sessions}`}</Text>
          <Text style={styles.funnelRow}>{`4) ${id.admin.funnelSignupComplete}: ${funnel.signup_complete_sessions}`}</Text>
        </>
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
  funnelRow: {
    color: colors.text,
    fontSize: typography.body,
  },
  emptyState: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
});
