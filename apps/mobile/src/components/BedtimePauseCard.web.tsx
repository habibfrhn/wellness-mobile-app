import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

const cardShadow = "0px 16px 40px rgba(33, 50, 94, 0.14)";

type Props = {
  onStart: () => void;
  onChooseAudio: () => void;
};

export default function BedtimePauseCard({ onStart, onChooseAudio }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.copyWrap}>
        <Text style={styles.eyebrow}>{id.home.bedtimePauseTitle}</Text>
        <Text style={styles.description}>{id.home.bedtimePauseDescription}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>{id.home.bedtimePauseStartCta}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onChooseAudio}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{id.home.bedtimePauseAudioCta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(33, 50, 94, 0.08)",
    padding: spacing.lg,
    gap: spacing.lg,
    boxShadow: cardShadow,
  },
  copyWrap: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  description: {
    maxWidth: 620,
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 24,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  primaryButton: {
    minHeight: 48,
    minWidth: 132,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(33, 50, 94, 0.22)",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.86,
  },
});
