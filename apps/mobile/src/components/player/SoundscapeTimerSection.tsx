import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  colors,
  controlSizes,
  radius,
  spacing,
  typography,
} from "../../theme/tokens";

type TimerOption = {
  label: string;
  seconds: number;
};

type SoundscapeTimerSectionProps = {
  timerOptions: TimerOption[];
  timerSeconds: number | null;
  timerRemaining: number | null;
  isSessionActive: boolean;
  onSelectTimer: (seconds: number) => void;
  compact?: boolean;
};

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function SoundscapeTimerSection({
  timerOptions,
  timerSeconds,
  timerRemaining,
  isSessionActive,
  onSelectTimer,
  compact = false,
}: SoundscapeTimerSectionProps) {
  const [showTimerInfo, setShowTimerInfo] = useState(false);

  return (
    <View
      style={[
        styles.soundscapeOptions,
        compact && styles.soundscapeOptionsCompact,
      ]}
    >
      <View style={styles.optionBlock}>
        <View style={styles.optionHeader}>
          <Text
            style={[styles.optionTitle, compact && styles.optionTitleCompact]}
          >
            Timer
          </Text>
          <View style={styles.infoWrap}>
            <Pressable
              onPressIn={() => setShowTimerInfo(true)}
              onPressOut={() => setShowTimerInfo(false)}
              style={[styles.infoIcon, compact && styles.infoIconCompact]}
              hitSlop={6}
            >
              <Text style={styles.infoIconText}>?</Text>
            </Pressable>
            {showTimerInfo ? (
              <View
                style={[
                  styles.infoBubbleOverlay,
                  compact && styles.infoBubbleOverlayCompact,
                ]}
              >
                <Text style={styles.infoText}>
                  Audio akan dihentikan sesuai durasi timer.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {isSessionActive ? (
          <Text
            style={[
              styles.timerStatusText,
              compact && styles.timerStatusTextCompact,
            ]}
          >
            {formatTime(timerRemaining ?? timerSeconds ?? 0)}
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.timerRow,
              compact && styles.timerRowCompact,
            ]}
          >
            {timerOptions.map((option) => (
              <Pressable
                key={option.seconds}
                style={({ pressed }) => [
                  styles.timerPill,
                  compact && styles.timerPillCompact,
                  timerSeconds === option.seconds && styles.timerPillActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelectTimer(option.seconds)}
              >
                <Text
                  style={[
                    styles.timerText,
                    compact && styles.timerTextCompact,
                    timerSeconds === option.seconds && styles.timerTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  soundscapeOptions: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  soundscapeOptionsCompact: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  optionBlock: {
    gap: spacing.xs,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  optionTitle: {
    fontSize: typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  optionTitleCompact: {
    fontSize: typography.small,
  },
  infoWrap: {
    position: "relative",
  },
  infoIcon: {
    width: controlSizes.infoIcon,
    height: controlSizes.infoIcon,
    borderRadius: controlSizes.infoIcon / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconCompact: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  infoIconText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.mutedText,
  },
  infoBubbleOverlay: {
    position: "absolute",
    bottom: 24,
    left: -8,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    zIndex: 10,
    minWidth: 180,
  },
  infoBubbleOverlayCompact: {
    minWidth: 160,
  },
  infoText: {
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timerRowCompact: {
    gap: spacing.xs / 2,
  },
  timerPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  timerPillCompact: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs / 2,
  },
  timerPillActive: {
    backgroundColor: colors.primary,
  },
  timerText: {
    fontSize: typography.tiny,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  timerTextCompact: {
    fontSize: typography.micro,
  },
  timerTextActive: {
    color: colors.primaryText,
  },
  timerStatusText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.mutedText,
  },
  timerStatusTextCompact: {
    fontSize: typography.small,
  },
  pressed: { opacity: 0.85 },
});
