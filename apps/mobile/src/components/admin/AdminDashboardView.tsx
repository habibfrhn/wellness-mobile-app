import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type AudioMetric = {
  audio_id: string;
  plays: number;
  completes: number;
  abandons: number;
  completion_rate: number;
};

type FunnelMetric = {
  page_views: number;
  cta_clicks: number;
  signup_starts: number;
  signup_completes: number;
};

type TailoredMetric = {
  sessions_started: number;
  sessions_completed: number;
  sessions_dropped: number;
  completion_rate: number;
};

type Props = {
  audioMetrics: AudioMetric[];
  funnelMetric: FunnelMetric | null;
  tailoredMetric: TailoredMetric | null;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function AdminDashboardView({ audioMetrics, funnelMetric, tailoredMetric, onRefresh, onSignOut }: Props) {
  const totalAudioPlays = audioMetrics.reduce((sum, row) => sum + row.plays, 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{id.admin.dashboardTitle}</Text>
          <Text style={styles.subtitle}>{id.admin.dashboardSubtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.secondaryButton} onPress={() => void onRefresh()}>
            <Text style={styles.secondaryButtonText}>{id.admin.refreshCta}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void onSignOut()}>
            <Text style={styles.secondaryButtonText}>{id.admin.signOutCta}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{id.admin.totalAudioPlays}</Text>
          <Text style={styles.cardValue}>{totalAudioPlays}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{id.admin.tailoredCompletion}</Text>
          <Text style={styles.cardValue}>{tailoredMetric ? percent(tailoredMetric.completion_rate) : "-"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{id.admin.funnelSignupConversion}</Text>
          <Text style={styles.cardValue}>
            {funnelMetric && funnelMetric.page_views > 0
              ? percent(funnelMetric.signup_completes / funnelMetric.page_views)
              : "-"}
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{id.admin.audioTableTitle}</Text>
        {audioMetrics.map((row) => (
          <View style={styles.tableRow} key={row.audio_id}>
            <View style={styles.tableLabelWrap}>
              <Text style={styles.tableTitle}>{row.audio_id}</Text>
              <Text style={styles.tableMeta}>{row.plays} plays</Text>
            </View>
            <Text style={styles.tableValue}>{percent(row.completion_rate)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{id.admin.funnelTitle}</Text>
        {funnelMetric ? (
          <>
            <Text style={styles.funnelRow}>{`1) ${id.admin.funnelPageView}: ${funnelMetric.page_views}`}</Text>
            <Text style={styles.funnelRow}>{`2) ${id.admin.funnelCta}: ${funnelMetric.cta_clicks}`}</Text>
            <Text style={styles.funnelRow}>{`3) ${id.admin.funnelSignupStart}: ${funnelMetric.signup_starts}`}</Text>
            <Text style={styles.funnelRow}>{`4) ${id.admin.funnelSignupComplete}: ${funnelMetric.signup_completes}`}</Text>
          </>
        ) : (
          <Text style={styles.emptyState}>{id.admin.noData}</Text>
        )}
      </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    minWidth: 190,
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  cardValue: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.h2,
  },
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
  funnelRow: {
    color: colors.text,
    fontSize: typography.body,
  },
  emptyState: {
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
});
