import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import type {
  AdminAnalyticsRange,
  AdminAudioUsageRow,
} from "../../services/adminAnalytics";
import { spacing } from "../../theme/tokens";
import useViewportWidth from "../../hooks/useViewportWidth";
import { WEB_TABLET_BREAKPOINT } from "../../constants/webLayout";
import AdminAudioSummaryPanel from "./AdminAudioSummaryPanel";
import AdminDashboardHeader from "./AdminDashboardHeader";
import AdminDateRangeFilter from "./AdminDateRangeFilter";
import AdminStatusMessage from "./AdminStatusMessage";

type Props = {
  busy: boolean;
  errorMessage: string | null;
  range: AdminAnalyticsRange;
  onRangeChange: (next: AdminAnalyticsRange) => void;
  audioRows: AdminAudioUsageRow[];
  lastUpdatedAt: Date | null;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function AdminDashboardView({
  busy,
  errorMessage,
  range,
  onRangeChange,
  audioRows,
  lastUpdatedAt,
  onRefresh,
  onSignOut,
}: Props) {
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && viewportWidth > WEB_TABLET_BREAKPOINT;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, isDesktopWeb && styles.desktopContent]}>
      <AdminDashboardHeader busy={busy} lastUpdatedAt={lastUpdatedAt} onRefresh={onRefresh} onSignOut={onSignOut} />

      <AdminDateRangeFilter value={range} onChange={onRangeChange} disabled={busy} />

      <AdminStatusMessage message={errorMessage} />

      <View style={[styles.sectionGrid, isDesktopWeb && styles.sectionGridDesktop]}>
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
