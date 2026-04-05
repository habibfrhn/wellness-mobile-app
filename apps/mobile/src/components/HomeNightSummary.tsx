import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import type { NightStreakHeroState } from "../services/nightStreak";
import { colors, radius, spacing, typography } from "../theme/tokens";
import HomeStreakHero from "./HomeStreakHero";

type Props = {
  onPressPrimary: () => void;
  streakState: NightStreakHeroState;
};

export default function HomeNightSummary({ onPressPrimary, streakState }: Props) {
  return (
    <View style={styles.container}>
      <HomeStreakHero state={streakState} />

      <Text style={styles.title}>{id.home.primaryCardTitle}</Text>
      <Text style={styles.body}>{id.home.primaryCardBody}</Text>

      <Pressable
        onPress={onPressPrimary}
        style={({ hovered, pressed }: any) => [
          styles.primaryButton,
          hovered && styles.primaryButtonHover,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontSize: typography.title,
    lineHeight: 24,
    fontWeight: "700",
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: typography.body,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignSelf: "stretch",
    minHeight: 56,
    width: "100%",
    maxWidth: 280,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonHover: { backgroundColor: colors.primaryHover },
  primaryButtonPressed: { backgroundColor: colors.primaryPressed },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});
