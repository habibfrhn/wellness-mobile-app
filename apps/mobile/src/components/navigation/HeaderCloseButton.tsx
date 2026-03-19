import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { id } from "../../i18n/strings";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  onPress: () => void;
};

export default function HeaderCloseButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={id.login.closeLabel}
    >
      <Text style={styles.closeText}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    minWidth: 32,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  closeText: {
    fontSize: typography.title,
    lineHeight: typography.title,
    color: colors.text,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
