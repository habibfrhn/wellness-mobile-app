import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "NightMode">;

export default function NightModeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{id.home.nightModeQuestion}</Text>

      <Pressable
        onPress={() => navigation.navigate("NightCheckIn", { mode: "calm_mind" })}
        style={({ pressed }) => [styles.optionCard, pressed ? styles.pressed : null]}
      >
        <Text style={styles.optionTitle}>{id.home.nightModeCalmMindTitle}</Text>
        <Text style={styles.optionSubtitle}>{id.home.nightModeCalmMindSubtitle}</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate("NightCheckIn", { mode: "release_accept" })}
        style={({ pressed }) => [styles.optionCard, pressed ? styles.pressed : null]}
      >
        <Text style={styles.optionTitle}>{id.home.nightModeReleaseAcceptTitle}</Text>
        <Text style={styles.optionSubtitle}>{id.home.nightModeReleaseAcceptSubtitle}</Text>
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
    gap: spacing.sm,
  },
  question: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  optionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  optionSubtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  pressed: {
    opacity: 0.85,
  },
});
