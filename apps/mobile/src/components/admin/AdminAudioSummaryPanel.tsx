import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import type { AdminAudioUsageRow } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  rows: AdminAudioUsageRow[];
};

export default function AdminAudioSummaryPanel({ rows }: Props) {
  const rowsByAudioId = useMemo(() => {
    const map = new Map<string, AdminAudioUsageRow>();
    rows.forEach((row) => {
      map.set(row.audio_id, row);
    });
    return map;
  }, [rows]);

  const orderedRows = useMemo(() => {
    const catalogRows = AUDIO_TRACKS.map((track) => {
      const row = rowsByAudioId.get(track.id);
      return {
        audioId: track.id,
        title: track.title,
        starts: row?.starts ?? 0,
        finishes: row?.finishes ?? 0,
      };
    });

    const catalogIds = new Set<string>(AUDIO_TRACKS.map((track) => track.id));
    const uncatalogedRows = rows
      .filter((row) => !catalogIds.has(row.audio_id))
      .map((row) => ({
        audioId: row.audio_id,
        title: row.audio_id,
        starts: row.starts,
        finishes: row.finishes,
      }));

    return [...catalogRows, ...uncatalogedRows];
  }, [rows, rowsByAudioId]);

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{id.admin.audioUsageTitle}</Text>
      <Text style={styles.panelSubtitle}>{id.admin.audioUsageSubtitle}</Text>

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.audioCol]}>{id.admin.audioLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioStartsLabel}</Text>
        <Text style={styles.headerCell}>{id.admin.audioFinishesLabel}</Text>
      </View>

      {orderedRows.map((row) => (
        <View key={row.audioId} style={styles.tableRow}>
          <Text style={[styles.valueCell, styles.audioCol]}>{row.title}</Text>
          <Text style={styles.valueCell}>{row.starts}</Text>
          <Text style={styles.valueCell}>{row.finishes}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
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
    fontSize: typography.caption,
  },
  audioCol: {
    flex: 2.4,
  },
});
