import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  onPressLogin: () => void;
};

export default function SignUpLoginPrompt({ onPressLogin }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{id.signup.hasAccountPrefix}</Text>
      <Pressable onPress={onPressLogin} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <Text style={styles.link}>{id.signup.loginLink}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  text: {
    color: colors.text,
    fontSize: typography.body,
  },
  pressable: {
    paddingVertical: 0,
  },
  link: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  pressed: { opacity: 0.85 },
});
