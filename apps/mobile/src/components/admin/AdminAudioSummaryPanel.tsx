import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import type { AdminAudioEngagementRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminAudioEngagementRow[];
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function AdminAudioSummaryPanel({ rows }: Props) {
  const rowsByAudioId = useMemo(() => {
    const map = new Map<string, AdminAudioEngagementRow>();
    rows.forEach((row) => {
      map.set(row.audio_id, row);
    });
    return map;
  }, [rows]);

  const orderedRows = useMemo(() => {
    return AUDIO_TRACKS.map((track) => {
      const row = rowsByAudioId.get(track.id);
      return {
        audioId: track.id,
        title: track.title,
        clicks: row?.clicks ?? 0,
        starts: row?.starts ?? 0,
        completes: row?.completes ?? 0,
        abandons: row?.abandons ?? 0,
        completionRate: row?.completion_rate ?? 0,
      };
    });
  }, [rowsByAudioId]);

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.audioUsageTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.audioUsageSubtitle}</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.audioCol]}>{id.admin.audioLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioClicksLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioStartsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioCompletesLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioAbandonsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioCompletionRateLabel}</Text>
      </View>

      {orderedRows.map((row) => (
        <View key={row.audioId} style={styles.tableRow}>
          <Text style={[styles.valueCell, styles.audioCol]}>{row.title}</Text>
          <Text style={styles.valueCell}>{row.clicks}</Text>
          <Text style={styles.valueCell}>{row.starts}</Text>
          <Text style={styles.valueCell}>{row.completes}</Text>
          <Text style={styles.valueCell}>{row.abandons}</Text>
          <Text style={styles.valueCell}>{percent(row.completionRate)}</Text>
        </View>
      ))}
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
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
    paddingBottom: spacing.sm,
  },
  headerCell: {
    flex: 1,
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.bg,
    paddingVertical: spacing.sm,
  },
  valueCell: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
  },
  audioCol: {
    flex: 2,
  },
});
