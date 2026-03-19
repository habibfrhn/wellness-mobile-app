import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
};

export default function HomeGreetingPrompt({ label, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    marginTop: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  label: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.82,
  },
});
