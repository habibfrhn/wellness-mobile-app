import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase, AUTH_CALLBACK } from "../../services/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function SignUpScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const canPress = useMemo(() => !busy, [busy]);

  function validate(): string[] {
    const issues: string[] = [];
    const e = email.trim().toLowerCase();

    if (!isValidEmail(e)) issues.push("Email tidak valid.");
    if (password.length < 8) issues.push("Kata sandi minimal 8 karakter.");
    if (confirm.length < 8) issues.push("Ulangi kata sandi minimal 8 karakter.");
    if (password && confirm && password !== confirm) issues.push("Kata sandi dan konfirmasi tidak sama.");

    return issues;
  }

  async function onSubmit() {
    const issues = validate();
    if (issues.length > 0) {
      Alert.alert(
        "Periksa kembali",
        issues.map((x) => `• ${x}`).join("\n")
      );
      return;
    }

    const e = email.trim().toLowerCase();

    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { emailRedirectTo: AUTH_CALLBACK }
      });

      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
        return;
      }

      navigation.replace("VerifyEmail", { email: e });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.signup.title}</Text>
      <Text style={styles.subtitle}>{id.signup.subtitle}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View>
          <Text style={styles.label}>{id.signup.emailLabel}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={id.signup.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{id.signup.passwordLabel}</Text>
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>
                {showPassword ? id.common.hidePassword : id.common.showPassword}
              </Text>
            </Pressable>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            placeholder={id.signup.passwordPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{id.signup.confirmPasswordLabel}</Text>
            <Pressable
              onPress={() => setShowConfirm((v) => !v)}
              hitSlop={10}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>
                {showConfirm ? id.common.hidePassword : id.common.showPassword}
              </Text>
            </Pressable>
          </View>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showConfirm}
            placeholder={id.signup.confirmPasswordPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={!canPress}
          style={({ pressed }) => [
            styles.primaryButton,
            !canPress && styles.disabled,
            pressed && canPress && styles.pressed
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? id.signup.busyCta : id.signup.primaryCta}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace("Login", { initialEmail: email.trim() })}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.signup.secondaryCta}</Text>
        </Pressable>

        <Text style={styles.finePrint}>{id.signup.finePrint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700" },
  subtitle: { marginTop: spacing.xs, fontSize: typography.body, color: colors.mutedText, lineHeight: 22 },

  label: { fontSize: typography.small, color: colors.text, fontWeight: "700", marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.secondary
  },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  linkText: { color: colors.text, fontSize: typography.small, fontWeight: "700" },

  primaryButton: {
    marginTop: spacing.sm,
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

  finePrint: { marginTop: spacing.sm, fontSize: typography.small, color: colors.mutedText, textAlign: "center" },

  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
