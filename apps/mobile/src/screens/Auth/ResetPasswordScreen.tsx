import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.reset.title}</Text>
      <Text style={styles.subtitle}>{id.reset.subtitle}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{id.placeholders.nextStepTitle}</Text>
          <Text style={styles.cardBody}>{id.placeholders.nextStepBodyReset}</Text>
        </View>

        <Pressable onPress={() => {}} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{id.reset.set}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>{id.reset.backToLogin}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700" },
  subtitle: { marginTop: spacing.xs, fontSize: typography.body, color: colors.mutedText, lineHeight: 22 },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary
  },
  cardTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  cardBody: { marginTop: spacing.xs, fontSize: typography.small, color: colors.mutedText, lineHeight: 20 },
  primaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary
  },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.85 }
});
