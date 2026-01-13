import React from "react";
import { Image, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { colors, spacing } from "../theme/tokens";

type Props = {
  visible: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

const eyeOpenUri =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" viewBox="0 0 24 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 7c2.5-3.5 6-5.5 11-5.5S20.5 3.5 23 7c-2.5 3.5-6 5.5-11 5.5S3.5 10.5 1 7Z"/>
      <circle cx="12" cy="7" r="2.5" fill="currentColor" stroke="none"/>
    </svg>`
  );

const eyeClosedUri =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" viewBox="0 0 24 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 7c2.5-3.5 6-5.5 11-5.5S20.5 3.5 23 7c-2.5 3.5-6 5.5-11 5.5S3.5 10.5 1 7Z"/>
      <line x1="3" y1="1" x2="21" y2="13"/>
    </svg>`
  );

export default function PasswordToggle({ visible, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.touch, style, pressed && styles.pressed]}
    >
      <Image source={{ uri: visible ? eyeOpenUri : eyeClosedUri }} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  pressed: { opacity: 0.7 },
  icon: { width: 24, height: 14, tintColor: colors.mutedText },
});
