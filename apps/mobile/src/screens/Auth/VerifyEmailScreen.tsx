import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

export default function VerifyEmailScreen({ route, navigation }: Props) {
  const email = route.params?.email ?? "(email)";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.subtitle}>
        We sent a verification link to:
      </Text>
      <Text style={styles.email}>{email}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next step (Step 9.3)</Text>
          <Text style={styles.cardBody}>
            We will implement: Open email app, resend with cooldown, and “change
            email” (MVP: re-signup with new email).
          </Text>
        </View>

        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Open email app</Text>
        </Pressable>

        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Resend email</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Change email</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
        >
          <Text style={styles.linkText}>Back to log in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.bg
  },
  title: {
    fontSize: typography.h2,
    color: colors.text,
    fontWeight: "700"
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.mutedText
  },
  email: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "700"
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text
  },
  cardBody: {
    marginTop: spacing.xs,
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: 20
  },
  primaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center"
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center"
  },
  linkButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md
  },
  linkText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center"
  },
  pressed: { opacity: 0.85 }
});
