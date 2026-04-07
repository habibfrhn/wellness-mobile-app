import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, typography } from "../theme/tokens";

type Props = {
  visible: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

const iconSize = typography.iconMd;

export default function PasswordToggle({ visible, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.touch, style, pressed && styles.pressed]}
    >
      <MaterialIcons name={visible ? "visibility" : "visibility-off"} size={iconSize} color={colors.mutedText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  pressed: { opacity: 0.7 },
});
