import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "NightCheckIn">;

const STRESS_LEVELS = [1, 2, 3, 4, 5] as const;

export default function NightCheckInScreen({ navigation, route }: Props) {
  const [stressBefore, setStressBefore] = useState<number>(3);

  const handleStart = () => {
    navigation.navigate("NightStep1", {
      mode: route.params.mode,
      stressBefore,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{id.home.nightCheckInQuestion}</Text>

      <View style={styles.selectorRow}>
        {STRESS_LEVELS.map((level) => {
          const selected = level === stressBefore;
          return (
            <Pressable
              key={level}
              onPress={() => setStressBefore(level)}
              style={[styles.levelButton, selected ? styles.levelButtonSelected : null]}
            >
              <Text style={[styles.levelText, selected ? styles.levelTextSelected : null]}>{level}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={handleStart} style={styles.startButton}>
        <Text style={styles.startButtonText}>{id.home.nightCheckInStartCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  question: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  selectorRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  levelButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  levelButtonSelected: {
    backgroundColor: colors.primary,
  },
  levelText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  levelTextSelected: {
    color: colors.primaryText,
  },
  startButton: {
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.text,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  startButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
});
