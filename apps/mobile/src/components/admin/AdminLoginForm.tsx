import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  busy: boolean;
  errorMessage: string | null;
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onContinueWithGoogle: () => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
};

export default function AdminLoginForm({ busy, errorMessage, onSubmit, onContinueWithGoogle, onForgotPassword }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{id.admin.loginTitle}</Text>
      <Text style={styles.subtitle}>{id.admin.loginSubtitle}</Text>

      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={id.admin.emailLabel}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        secureTextEntry
        placeholder={id.admin.passwordLabel}
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        disabled={busy}
        style={({ pressed }) => [styles.cta, pressed && !busy && styles.ctaPressed, busy && styles.ctaDisabled]}
        onPress={() => void onSubmit({ email, password })}
      >
        {busy ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.ctaText}>{id.admin.loginCta}</Text>}
      </Pressable>

      <Pressable
        disabled={busy}
        style={({ pressed }) => [styles.secondaryCta, pressed && !busy && styles.ctaPressed, busy && styles.ctaDisabled]}
        onPress={() => void onContinueWithGoogle()}
      >
        <Text style={styles.secondaryCtaText}>{id.admin.googleLoginCta}</Text>
      </Pressable>

      <Pressable disabled={busy} onPress={() => void onForgotPassword(email)} style={styles.linkButton}>
        <Text style={styles.linkText}>{id.admin.forgotPasswordCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.mutedText,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
  },
  cta: {
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "600",
  },
  secondaryCta: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  secondaryCtaText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "600",
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.small,
    textDecorationLine: "underline",
  },
});
