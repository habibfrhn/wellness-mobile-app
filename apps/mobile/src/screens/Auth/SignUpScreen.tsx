import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase, AUTH_CALLBACK } from "../../services/supabase";
import PasswordToggle from "../../components/PasswordToggle";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import SignUpLoginPrompt from "../../components/auth/SignUpLoginPrompt";

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
      Alert.alert("Periksa kembali", issues.map((x) => `• ${x}`).join("\n"));
      return;
    }

    const e = email.trim().toLowerCase();

    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { emailRedirectTo: AUTH_CALLBACK },
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
    <AuthScreenLayout title={id.signup.title} subtitle={id.signup.subtitle}>
      <View style={authSharedStyles.formFields}>
        <View>
          <Text style={authSharedStyles.label}>{id.signup.emailLabel}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={id.signup.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={authSharedStyles.input}
          />
        </View>

        <View>
          <Text style={authSharedStyles.label}>{id.signup.passwordLabel}</Text>
          <View style={authSharedStyles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              placeholder={id.signup.passwordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={authSharedStyles.input}
            />
            <PasswordToggle
              visible={showPassword}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
        </View>

        <View>
          <Text style={authSharedStyles.label}>{id.signup.confirmPasswordLabel}</Text>
          <View style={authSharedStyles.inputWrap}>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showConfirm}
              placeholder={id.signup.confirmPasswordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={authSharedStyles.input}
            />
            <PasswordToggle
              visible={showConfirm}
              onPress={() => setShowConfirm((v) => !v)}
              accessibilityLabel={showConfirm ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
        </View>

        <View style={authSharedStyles.actionsStack}>
          <Pressable
            onPress={onSubmit}
            disabled={!canPress}
            style={({ pressed }) => [
              authSharedStyles.primaryButton,
              !canPress && authSharedStyles.disabled,
              pressed && canPress && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.signup.busyCta : id.signup.primaryCta}</Text>
          </Pressable>

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
