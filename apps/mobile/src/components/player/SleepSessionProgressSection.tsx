import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, controlSizes, radius, spacing, typography } from "../../theme/tokens";

type SleepSessionProgressSectionProps = {
  sessionCurrent: number;
  sessionDuration: number;
  sessionProgressRatio: number;
  onLayoutWidth: (width: number) => void;
  progressWidth: number;
};

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function SleepSessionProgressSection({
  sessionCurrent,
  sessionDuration,
  sessionProgressRatio,
  onLayoutWidth,
  progressWidth,
}: SleepSessionProgressSectionProps) {
  return (
    <>
      <View style={styles.progressWrap} onLayout={(event) => onLayoutWidth(event.nativeEvent.layout.width)}>
        <View style={styles.sessionProgressTrack}>
          <View style={[styles.sessionProgressFill, { width: progressWidth ? `${sessionProgressRatio * 100}%` : "0%" }]} />
        </View>
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, styles.sessionTimeText]}>{formatTime(sessionCurrent)}</Text>
        <Text style={[styles.timeText, styles.sessionTimeText]}>{formatTime(sessionDuration)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  progressWrap: { marginTop: spacing.xl },
  sessionProgressTrack: {
    height: controlSizes.progressHeight,
    borderRadius: radius.full,
    backgroundColor: `${colors.white}A6`,
    overflow: "hidden",
  },
  sessionProgressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}B3`,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs / 2,
    marginBottom: spacing.xl,
  },
  timeText: { fontSize: typography.caption, color: colors.mutedText },
  sessionTimeText: {
    opacity: 0.72,
  },
});
