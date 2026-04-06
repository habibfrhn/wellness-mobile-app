import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { id } from "../../i18n/strings";
import type {
  AdminAnalyticsRange,
  AdminAudioEngagementRow,
  AdminMonthlyComparisonRow,
  AdminProductActions,
  AdminTailoredSessionRow,
} from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import AdminAudioSummaryPanel from "./AdminAudioSummaryPanel";
import AdminDateRangeFilter from "./AdminDateRangeFilter";
import AdminMonthlyComparisonPanel from "./AdminMonthlyComparisonPanel";
import AdminProductActionsPanel from "./AdminProductActionsPanel";
import AdminTailoredSessionsPanel from "./AdminTailoredSessionsPanel";

type Props = {
  range: AdminAnalyticsRange;
  onRangeChange: (next: AdminAnalyticsRange) => void;
  busy: boolean;
  errorMessage: string | null;
  productActions: AdminProductActions | null;
  audioRows: AdminAudioEngagementRow[];
  tailoredRows: AdminTailoredSessionRow[];
  monthlyRows: AdminMonthlyComparisonRow[];
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function AdminDashboardView({
  range,
  onRangeChange,
  busy,
  errorMessage,
  productActions,
  audioRows,
  tailoredRows,
  monthlyRows,
  onRefresh,
  onSignOut,
}: Props) {
  const viewport = getWebViewport(useViewportWidth());
  const isDesktop = viewport === "desktop";

  return (
    <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}>
      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
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

        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          <View style={[styles.leftColumn, isDesktop && styles.leftColumnDesktop]}>
            <AdminProductActionsPanel actions={productActions} />
            <AdminTailoredSessionsPanel rows={tailoredRows} />
          </View>
          <View style={styles.rightColumn}>
            <AdminAudioSummaryPanel rows={audioRows} />
            <AdminMonthlyComparisonPanel rows={monthlyRows} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    padding: spacing.lg,
  },
  contentDesktop: {
    alignItems: "center",
  },
  layout: {
    width: "100%",
    maxWidth: 1320,
    gap: spacing.md,
  },
  layoutDesktop: {
    gap: spacing.lg,
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
    flexWrap: "wrap",
  },
  grid: {
    gap: spacing.md,
  },
  gridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  leftColumn: {
    gap: spacing.md,
  },
  leftColumnDesktop: {
    width: 360,
    flexShrink: 0,
  },
  rightColumn: {
    flex: 1,
    gap: spacing.md,
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
