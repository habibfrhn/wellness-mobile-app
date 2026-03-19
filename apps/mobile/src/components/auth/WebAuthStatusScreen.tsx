import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, lineHeights, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
};

export default function WebAuthStatusScreen({ title, body, actionLabel, onAction, busy = false }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        {busy ? <ActivityIndicator color={colors.primary} size="large" style={styles.spinner} /> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  spinner: {
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: lineHeights.relaxed,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
  },
});
