import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { id } from "../../i18n/strings";
import { colors } from "../../theme/tokens";

type Props = {
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export default function HeaderCloseButton({ onPress, containerStyle, accessibilityLabel = id.login.closeLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.closeButton, containerStyle, pressed && styles.pressed]}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
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
  },
  closeText: {
    fontSize: 26,
    lineHeight: 26,
    color: colors.text,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
