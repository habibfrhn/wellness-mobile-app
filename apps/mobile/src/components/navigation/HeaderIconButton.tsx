import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "../../theme/tokens";

type Props = {
  icon: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export default function HeaderIconButton({ icon, accessibilityLabel, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ focused, hovered, pressed }: any) => [
        styles.button,
        hovered && styles.hovered,
        pressed && styles.pressed,
        focused && styles.focused,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  icon: {
    fontSize: 24,
    lineHeight: 24,
    color: colors.text,
    fontWeight: "700",
  },
  hovered: {
    backgroundColor: colors.secondaryHover,
  },
  pressed: {
    backgroundColor: colors.secondaryPressed,
  },
  focused: {
    boxShadow: `0 0 0 2px ${colors.primary}`,
  },
});
