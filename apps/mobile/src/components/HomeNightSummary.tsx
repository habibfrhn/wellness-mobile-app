import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing } from "../theme/tokens";

type Props = {
  onPressPrimary: () => void;
  onPressSecondary: () => void;
};

export default function HomeNightSummary({ onPressPrimary, onPressSecondary }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.streak}>{id.home.streakPlaceholder}</Text>
      <Text style={styles.lastNight}>{id.home.lastNightPlaceholder}</Text>

      <Pressable onPress={onPressPrimary} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>

      <Pressable onPress={onPressSecondary}>
        <Text style={styles.secondaryButtonText}>{id.home.secondaryModeCta}</Text>
      </Pressable>
    </View>
  );
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
