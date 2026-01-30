import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";

import { colors, spacing, radius, typography } from "../theme/tokens";
import { id } from "../i18n/strings";

type Props = {
  email: string;
  onLogout: () => void;
};

export default function AccountSummary({ email, onLogout }: Props) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.sectionTitle}>{id.account.emailLabel}</Text>
        <Text style={styles.email}>{email || "-"}</Text>
      </View>

      <Pressable onPress={onLogout} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Text style={styles.secondaryButtonText}>{id.account.logout}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    backgroundColor: colors.bg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  sectionTitle: { fontSize: typography.small, color: colors.mutedText, fontWeight: "700" },
  email: { fontSize: typography.body, color: colors.text, fontWeight: "700" },

  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },

  pressed: { opacity: 0.85 },
});
