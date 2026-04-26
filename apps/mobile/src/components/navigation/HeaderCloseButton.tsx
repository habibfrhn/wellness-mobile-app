import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { id } from "../../i18n/strings";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function HeaderCloseButton({ onPress, containerStyle }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.closeButton, containerStyle, pressed && styles.pressed]}
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
    borderRadius: 22,
  },
  closeText: {
    fontSize: typography.title,
    lineHeight: typography.title,
    color: colors.text,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
