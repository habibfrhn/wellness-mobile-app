import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { type NightStreakHeroState } from "../services/nightStreak";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  state: NightStreakHeroState;
};

export default function HomeStreakHero({ state }: Props) {
  const copy = useMemo(() => {
    if (state.kind === "active") {
      const count = state.count;
      return {
        primary: id.home.streakActivePrimary.replaceAll("{count}", String(count)),
        supporting: id.home.streakActiveSupporting.replaceAll("{count}", String(count)),
      };
    }

    if (state.kind === "broken") {
      return {
        primary: id.home.streakBrokenPrimary,
        supporting: id.home.streakBrokenSupporting,
      };
    }

    return {
      primary: id.home.streakNoStreakPrimary,
      supporting: id.home.streakNoStreakSupporting,
    };
  }, [state]);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{id.home.streakLabel}</Text>
      <Text style={styles.primary}>{copy.primary}</Text>
      <Text style={styles.supporting}>{copy.supporting}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.sm,
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}1A`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.mutedText,
    fontSize: typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  primary: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  supporting: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: typography.body,
  },
});
