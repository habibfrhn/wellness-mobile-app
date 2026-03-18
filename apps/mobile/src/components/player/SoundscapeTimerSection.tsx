import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, controlSizes, radius, spacing, typography } from "../../theme/tokens";

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
}: SoundscapeTimerSectionProps) {
  const [showTimerInfo, setShowTimerInfo] = useState(false);

  return (
    <View style={styles.soundscapeOptions}>
      <View style={styles.optionBlock}>
        <View style={styles.optionHeader}>
          <Text style={styles.optionTitle}>Timer</Text>
          <View style={styles.infoWrap}>
            <Pressable
              onPressIn={() => setShowTimerInfo(true)}
              onPressOut={() => setShowTimerInfo(false)}
              style={styles.infoIcon}
              hitSlop={6}
            >
              <Text style={styles.infoIconText}>?</Text>
            </Pressable>
            {showTimerInfo ? (
              <View style={styles.infoBubbleOverlay}>
                <Text style={styles.infoText}>Audio akan dihentikan sesuai durasi timer.</Text>
              </View>
            ) : null}
          </View>
        </View>

        {isSessionActive ? (
          <Text style={styles.timerStatusText}>{formatTime(timerRemaining ?? timerSeconds ?? 0)}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timerRow}>
            {timerOptions.map((option) => (
              <Pressable
                key={option.seconds}
                style={({ pressed }) => [
                  styles.timerPill,
                  timerSeconds === option.seconds && styles.timerPillActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelectTimer(option.seconds)}
              >
                <Text style={[styles.timerText, timerSeconds === option.seconds && styles.timerTextActive]}>
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
  infoText: {
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timerPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
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
  timerTextActive: {
    color: colors.primaryText,
  },
  timerStatusText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
