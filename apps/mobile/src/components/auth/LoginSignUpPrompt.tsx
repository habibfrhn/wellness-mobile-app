import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  onPressSignUp: () => void;
};

export default function LoginSignUpPrompt({ onPressSignUp }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{id.login.noAccountPrefix}</Text>
      <Pressable onPress={onPressSignUp} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <Text style={styles.link}>{id.login.create}</Text>
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
