import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  busy?: boolean;
  onPress: () => void;
};

export default function GoogleAuthButton({ busy = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.button, busy && styles.disabled, pressed && !busy && styles.pressed]}
    >
      <View style={styles.content}>
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <MaterialCommunityIcons name="google" size={typography.iconMd} color={colors.text} />
        )}
        <Text style={styles.label}>{busy ? id.auth.googleBusy : id.auth.continueWithGoogle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.mutedText,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.82,
  },
});
