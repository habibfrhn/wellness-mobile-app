import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing } from "../theme/tokens";

type Props = {
  visible: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

export default function PasswordToggle({ visible, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.touch, pressed && styles.pressed]}
    >
      <View style={styles.eye} />
      {!visible ? <View style={styles.slash} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  pressed: { opacity: 0.7 },
  eye: {
    width: 22,
    height: 12,
    borderWidth: 2,
    borderColor: colors.mutedText,
    borderRadius: 12,
  },
  slash: {
    position: "absolute",
    width: 2,
    height: 20,
    backgroundColor: colors.mutedText,
    transform: [{ rotate: "45deg" }],
    top: -1,
    right: 10,
  },
});
