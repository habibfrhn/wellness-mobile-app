import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing } from "../theme/tokens";

type Props = {
  streakCount: number;
  lastNightStressDelta?: number | null;
  onPressPrimary: () => void;
  onPressSecondary: () => void;
};

export default function HomeNightSummary({
  streakCount,
  lastNightStressDelta = null,
  onPressPrimary,
  onPressSecondary,
}: Props) {
  const streakText = id.home.streakWithCount.replace("{count}", String(streakCount));

  const deltaText =
    typeof lastNightStressDelta === "number"
      ? id.home.lastNightStressDelta.replace("{delta}", formatStressDelta(lastNightStressDelta))
      : id.home.lastNightPlaceholder;
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>{streakText}</Text>
      <Text style={styles.lastNight}>{deltaText}</Text>

      <Pressable onPress={onPressPrimary} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>

      <Pressable onPress={onPressSecondary}>
        <Text style={styles.secondaryButtonText}>{id.home.secondaryModeCta}</Text>
      </Pressable>
    </View>
  );
}

function formatStressDelta(delta: number): string {
  if (delta === 0) {
    return id.home.stressDeltaSteady;
  }

  // Positive delta means stress reduced from check-in to check-out.
  if (delta > 0) {
    return id.home.stressDeltaDown.replace("{amount}", String(delta));
  }

  return id.home.stressDeltaUp.replace("{amount}", String(Math.abs(delta)));
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  streak: {
    color: colors.text,
  },
  lastNight: {
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: colors.text,
    textAlign: "center",
    fontSize: 12,
  },
});
