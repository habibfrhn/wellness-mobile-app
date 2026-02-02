import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, spacing, iconSizes } from "../theme/tokens";

type Props = {
  visible: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

const iconSize = iconSizes.md;

export default function PasswordToggle({ visible, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.touch, style, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons
        name={visible ? "eye-outline" : "eye-off-outline"}
        size={iconSize}
        color={colors.mutedText}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  pressed: { opacity: 0.7 },
});
