import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { supabase, AUTH_CALLBACK } from "../../services/supabase";
import { continueWithGoogle } from "../../services/authOAuth";
import { setPendingProfileName } from "../../services/pendingProfileName";
import PasswordToggle from "../../components/PasswordToggle";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import AuthTextField from "../../components/auth/AuthTextField";
import SignUpLoginPrompt from "../../components/auth/SignUpLoginPrompt";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function SignUpScreen({ navigation, route }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);

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
      Alert.alert("Periksa kembali", issues.map((x) => `• ${x}`).join("\n"));
      return;
    }

    const e = email.trim().toLowerCase();
    const trimmedName = name.trim();

    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: e,
        password,
        options: {
          emailRedirectTo: AUTH_CALLBACK,
          data: trimmedName ? { full_name: trimmedName } : undefined,
        },
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

  async function onContinueWithGoogle() {
    if (busy || busyGoogle) {
      return;
    }

    setBusyGoogle(true);
    try {
      await setPendingProfileName(name);
      await continueWithGoogle({ nextRoute: "SignUp" });
    } catch (error) {
      Alert.alert(id.common.errorTitle, error instanceof Error ? error.message : id.common.tryAgain);
      setBusyGoogle(false);
    }
  }

  return (
    <AuthScreenLayout title={id.signup.title} subtitle={id.signup.subtitle}>
      <View style={authSharedStyles.formFields}>
        <AuthTextField
          label={id.signup.nameLabel}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          placeholder={id.signup.namePlaceholder}
        />

        <AuthTextField
          label={id.signup.emailLabel}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={id.signup.emailPlaceholder}
        />

        <AuthTextField
          label={id.signup.passwordLabel}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showPassword}
          placeholder={id.signup.passwordPlaceholder}
          rightNode={
            <PasswordToggle
              visible={showPassword}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          }
        />

        <AuthTextField
          label={id.signup.confirmPasswordLabel}
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={!showConfirm}
          placeholder={id.signup.confirmPasswordPlaceholder}
          rightNode={
            <PasswordToggle
              visible={showConfirm}
              onPress={() => setShowConfirm((v) => !v)}
              accessibilityLabel={showConfirm ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          }
        />

        <View style={authSharedStyles.actionsStack}>
          <Pressable
            onPress={onSubmit}
            disabled={!canPress || busyGoogle}
            style={({ pressed }) => [
              authSharedStyles.primaryButton,
              (!canPress || busyGoogle) && authSharedStyles.disabled,
              pressed && canPress && !busyGoogle && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.signup.busyCta : id.signup.primaryCta}</Text>
          </Pressable>

          <GoogleAuthButton busy={busyGoogle} onPress={() => void onContinueWithGoogle()} />

          <SignUpLoginPrompt onPressLogin={() => navigation.replace("Login", { initialEmail: email.trim() })} />
        </View>

        <Text style={styles.finePrint}>{id.signup.finePrint}</Text>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  toggle: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  finePrint: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
