import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  streakCount: number;
  lastNightStressDelta?: number | null;
  onPressPrimary: () => void;
};

export default function HomeNightSummary({
  streakCount,
  lastNightStressDelta = null,
  onPressPrimary,
}: Props) {
  const streakText = id.home.streakRoutine.replace("{count}", String(streakCount));

  const deltaText =
    typeof lastNightStressDelta === "number"
      ? id.home.lastNightStressDelta.replace("{delta}", formatStressDelta(lastNightStressDelta))
      : id.home.lastNightPlaceholder;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.primaryCardTitle}</Text>
      <Text style={styles.subtitle}>{id.home.primaryCardSubtitle}</Text>

      {streakCount >= 1 ? <Text style={styles.streak}>{streakText}</Text> : null}
      <Text style={styles.lastNight}>{deltaText}</Text>

      <Pressable onPress={onPressPrimary} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>
    </View>
  );
}

function formatStressDelta(delta: number): string {
  if (delta === 0) {
    return id.home.stressDeltaSteady;
  }

  if (delta > 0) {
    return id.home.stressDeltaDown.replace("{amount}", String(delta));
  }

  return id.home.stressDeltaUp.replace("{amount}", String(Math.abs(delta)));
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  streak: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  lastNight: {
    color: colors.mutedText,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
});
