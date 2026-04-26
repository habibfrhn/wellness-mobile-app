import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, radius } from "../../theme/tokens";

type Props = {
  icon: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export default function HeaderIconButton({ icon, accessibilityLabel, onPress }: Props) {
  const viewport = getWebViewport(useViewportWidth());
  const isTouchViewport = viewport === "mobile" || viewport === "tablet";

  return (
    <Pressable
      onPress={onPress}
      style={({ focused, hovered, pressed }: any) => [
        styles.button,
        isTouchViewport && styles.buttonTouch,
        hovered && styles.hovered,
        pressed && styles.pressed,
        focused && styles.focused,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
    >
      <Text style={[styles.icon, isTouchViewport && styles.iconTouch]}>{icon}</Text>
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
  },
  buttonTouch: {
    width: 48,
    height: 48,
  },
  icon: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.text,
    fontWeight: "700",
  },
  iconTouch: {
    fontSize: 24,
    lineHeight: 24,
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
