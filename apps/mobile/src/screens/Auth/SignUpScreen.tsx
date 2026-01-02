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
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 8 && !busy;
  }, [email, password, busy]);

  async function onSubmit() {
    const e = email.trim().toLowerCase();

    if (!isValidEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }
    if (password.length < 8) {
      Alert.alert(id.common.weakPassword, id.common.weakPasswordBody);
      return;
    }

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
          <Text style={styles.label}>{id.signup.passwordLabel}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder={id.signup.passwordPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
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
  primaryButton: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  finePrint: { marginTop: spacing.sm, fontSize: typography.small, color: colors.mutedText, textAlign: "center" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
