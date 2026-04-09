import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type {
  AdminAnalyticsRange,
  AdminAudioEngagementRow,
  AdminTailoredSessionRow,
} from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import useViewportWidth from "../../hooks/useViewportWidth";
import { WEB_TABLET_BREAKPOINT } from "../../constants/webLayout";
import AdminAudioSummaryPanel from "./AdminAudioSummaryPanel";
import AdminDateRangeFilter from "./AdminDateRangeFilter";
import AdminTailoredSessionsPanel from "./AdminTailoredSessionsPanel";

type Props = {
  busy: boolean;
  errorMessage: string | null;
  range: AdminAnalyticsRange;
  onRangeChange: (next: AdminAnalyticsRange) => void;
  homeSleepClicks: number;
  successfulSignups: number;
  audioRows: AdminAudioEngagementRow[];
  tailoredRows: AdminTailoredSessionRow[];
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function AdminDashboardView({
  busy,
  errorMessage,
  range,
  onRangeChange,
  homeSleepClicks,
  successfulSignups,
  audioRows,
  tailoredRows,
  onRefresh,
  onSignOut,
}: Props) {
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && viewportWidth > WEB_TABLET_BREAKPOINT;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, isDesktopWeb && styles.desktopContent]}>
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

      <View style={[styles.sectionGrid, isDesktopWeb && styles.sectionGridDesktop]}>
        <View style={styles.sectionCol}>
          <AdminTailoredSessionsPanel rows={tailoredRows} homeSleepClicks={homeSleepClicks} successfulSignups={successfulSignups} />
        </View>
        <View style={styles.sectionCol}>
          <AdminAudioSummaryPanel rows={audioRows} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    width: "100%",
    alignSelf: "stretch",
  },
  content: {
    width: "100%",
    maxWidth: 1240,
    alignSelf: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  desktopContent: {
    maxWidth: 1720,
    paddingHorizontal: spacing.xl + spacing.md,
    paddingVertical: spacing.xl,
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
  sectionGrid: {
    gap: spacing.md,
  },
  sectionGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  sectionCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
});
