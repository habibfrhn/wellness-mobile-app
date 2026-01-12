import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function LoginScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length > 0 && !busy;
  }, [email, password, busy]);

  async function onSubmit() {
    const e = email.trim().toLowerCase();

    if (!isValidEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password
      });

      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
        return;
      }

      // If not verified, keep user in auth flow
      const verified = Boolean(data.user?.email_confirmed_at);
      if (!verified) {
        navigation.replace("VerifyEmail", { email: e });
      }
      // If verified, App.tsx will route them to AppStack automatically.
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.login.title}</Text>
      <Text style={styles.subtitle}>{id.login.subtitle}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View>
          <Text style={styles.label}>{id.login.emailLabel}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={id.login.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View>
          <Text style={styles.label}>{id.login.passwordLabel}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              placeholder={id.login.passwordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={[styles.input, styles.inputWithToggle]}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={({ pressed }) => [styles.toggleButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? id.login.hidePassword : id.login.showPassword}
            >
              <Text style={styles.toggleButtonText}>{showPassword ? id.login.hidePassword : id.login.showPassword}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            (!canSubmit || busy) && styles.disabled,
            pressed && canSubmit && styles.pressed
          ]}
        >
          <Text style={styles.primaryButtonText}>{busy ? id.login.busyCta : id.login.primaryCta}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("ForgotPassword", { initialEmail: email.trim() })}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.login.forgot}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace("SignUp", { initialEmail: email.trim() })}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.login.create}</Text>
        </Pressable>
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
  inputWrapper: { position: "relative", justifyContent: "center" },
  inputWithToggle: { paddingRight: spacing.xl },
  toggleButton: {
    position: "absolute",
    right: spacing.sm,
    top: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  toggleButtonText: { color: colors.secondaryText, fontSize: typography.small, fontWeight: "700" },
  primaryButton: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
