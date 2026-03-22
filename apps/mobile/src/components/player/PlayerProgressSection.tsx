import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  colors,
  controlSizes,
  radius,
  spacing,
  typography,
} from "../../theme/tokens";

type PlayerProgressSectionProps = {
  current: number;
  duration: number;
  progressRatio: number;
  onLayoutWidth: (width: number) => void;
  onSeek: (locationX: number) => void;
  progressWidth: number;
  compact?: boolean;
};

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function PlayerProgressSection({
  current,
  duration,
  progressRatio,
  onLayoutWidth,
  onSeek,
  progressWidth,
  compact = false,
}: PlayerProgressSectionProps) {
  const progressHandleSize = spacing.sm;
  const progressHandleLeft = useMemo(() => {
    if (!progressWidth) {
      return 0;
    }
    return Math.min(
      Math.max(progressRatio * progressWidth - progressHandleSize / 2, 0),
      progressWidth - progressHandleSize,
    );
  }, [progressHandleSize, progressRatio, progressWidth]);
  const handleSeekGesture = useCallback(
    (locationX: number) => {
      onSeek(locationX);
    },
    [onSeek],
  );

  return (
    <>
      <View
        style={[styles.progressWrap, compact && styles.progressWrapCompact]}
        onLayout={(event) => onLayoutWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) =>
          handleSeekGesture(event.nativeEvent.locationX)
        }
        onResponderMove={(event) =>
          handleSeekGesture(event.nativeEvent.locationX)
        }
      >
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: progressWidth ? `${progressRatio * 100}%` : "0%" },
            ]}
          />
          <View style={[styles.progressHandle, { left: progressHandleLeft }]} />
        </View>
      </View>
      <View style={[styles.timeRow, compact && styles.timeRowCompact]}>
        <Text style={[styles.timeText, compact && styles.timeTextCompact]}>
          {formatTime(current)}
        </Text>
        <Text style={[styles.timeText, compact && styles.timeTextCompact]}>
          {formatTime(duration)}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  progressWrap: { marginTop: spacing.xl },
  progressWrapCompact: { marginTop: spacing.md },
  progressTrack: {
    height: controlSizes.progressHeight,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  progressHandle: {
    position: "absolute",
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.sm / 2,
    backgroundColor: colors.primary,
    top: "50%",
    transform: [{ translateY: -(spacing.sm / 2) }],
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs / 2,
    marginBottom: spacing.xl,
  },
  timeRowCompact: { marginBottom: spacing.md },
  timeText: { fontSize: typography.caption, color: colors.mutedText },
  timeTextCompact: { fontSize: typography.caption },
});
