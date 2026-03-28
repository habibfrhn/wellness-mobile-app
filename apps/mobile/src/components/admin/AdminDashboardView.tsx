import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type { AdminAnalyticsRange, AdminAudioSummary, AdminFunnel, AdminKpis, AdminMonthlyRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import AdminAudioSummaryPanel from "./AdminAudioSummaryPanel";
import AdminDateRangeFilter from "./AdminDateRangeFilter";
import AdminFunnelPanel from "./AdminFunnelPanel";
import AdminKpiCards from "./AdminKpiCards";
import AdminMonthlyPanel from "./AdminMonthlyPanel";

type Props = {
  range: AdminAnalyticsRange;
  onRangeChange: (next: AdminAnalyticsRange) => void;
  busy: boolean;
  errorMessage: string | null;
  kpis: AdminKpis | null;
  funnel: AdminFunnel | null;
  audioRows: AdminAudioSummary[];
  monthlyRows: AdminMonthlyRow[];
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function AdminDashboardView({
  range,
  onRangeChange,
  busy,
  errorMessage,
  kpis,
  funnel,
  audioRows,
  monthlyRows,
  onRefresh,
  onSignOut,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>{id.admin.dashboardTitle}</Text>
          <Text style={styles.subtitle}>{id.admin.dashboardSubtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.secondaryButton} onPress={() => void onRefresh()}>
            <Text style={styles.secondaryButtonText}>{busy ? id.admin.loadingLabel : id.admin.refreshCta}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void onSignOut()}>
            <Text style={styles.secondaryButtonText}>{id.admin.signOutCta}</Text>
          </Pressable>
        </View>
      </View>

      <AdminDateRangeFilter value={range} onChange={onRangeChange} />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <AdminKpiCards kpis={kpis} />
      <AdminAudioSummaryPanel rows={audioRows} />
      <AdminFunnelPanel funnel={funnel} />
      {range === "12m" ? <AdminMonthlyPanel rows={monthlyRows} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 260,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: typography.small,
  },
  secondaryButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
});
