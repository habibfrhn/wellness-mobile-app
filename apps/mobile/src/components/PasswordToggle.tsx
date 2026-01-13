import React from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, spacing } from "../theme/tokens";

type Props = {
  visible: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export default function PasswordToggle({ visible, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.touch, style, pressed && styles.pressed]}
    >
      <View style={styles.eye}>
        <View style={styles.pupil} />
      </View>
      {!visible ? <View style={styles.slash} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  pressed: { opacity: 0.7 },
  eye: {
    width: 24,
    height: 14,
    borderWidth: 2,
    borderColor: colors.mutedText,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedText,
  },
  slash: {
    position: "absolute",
    width: 2,
    height: 22,
    backgroundColor: colors.mutedText,
    transform: [{ rotate: "45deg" }],
    top: -2,
    right: 10,
  },
});
