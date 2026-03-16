import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

const KEY_HOME_START_OPTION = "home:start_option";

export type HomeStartOption = "calm_mind" | "soundscape" | "direct_sleep";

type Props = {
  streakCount: number;
  lastNightStressDelta?: number | null;
  onPressPrimary: (option: HomeStartOption) => void;
};

const OPTIONS: Array<{ key: HomeStartOption; label: string }> = [
  { key: "calm_mind", label: id.home.startOptionCalmMind },
  { key: "soundscape", label: id.home.startOptionSoundscape },
  { key: "direct_sleep", label: id.home.startOptionDirectSleep },
];

export default function HomeNightSummary({
  streakCount,
  lastNightStressDelta = null,
  onPressPrimary,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<HomeStartOption>("calm_mind");

  useEffect(() => {
    let mounted = true;

    (async () => {
      const saved = await AsyncStorage.getItem(KEY_HOME_START_OPTION);
      if (!mounted) {
        return;
      }

      if (saved === "calm_mind" || saved === "soundscape" || saved === "direct_sleep") {
        setSelectedOption(saved);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const streakText = id.home.streakRoutine.replace("{count}", String(streakCount));
  const stressText =
    typeof lastNightStressDelta === "number"
      ? id.home.lastNightStressDelta.replace("{delta}", formatStressDelta(lastNightStressDelta))
      : null;

  const onSelectOption = (option: HomeStartOption) => {
    setSelectedOption(option);
    void AsyncStorage.setItem(KEY_HOME_START_OPTION, option);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.primaryCardTitle}</Text>

      <View style={styles.optionsWrap}>
        {OPTIONS.map((option) => {
          const active = selectedOption === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => onSelectOption(option.key)}
              style={[styles.optionChip, active && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {streakCount >= 1 ? <Text style={styles.streak}>{streakText}</Text> : null}
      {stressText ? <Text style={styles.lastNight}>{stressText}</Text> : null}

      <Pressable onPress={() => onPressPrimary(selectedOption)} style={styles.primaryButton}>
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
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  optionChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.mutedText,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.white,
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionChipText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  optionChipTextActive: {
    color: colors.primaryText,
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
