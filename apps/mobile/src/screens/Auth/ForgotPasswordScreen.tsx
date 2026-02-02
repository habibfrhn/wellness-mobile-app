import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography, lineHeights } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase, AUTH_RESET } from "../../services/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => isValidEmail(email) && !busy, [email, busy]);

  async function onSubmit() {
    const e = email.trim().toLowerCase();
    if (!isValidEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: AUTH_RESET
      });

      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
        return;
      }

      Alert.alert(id.forgot.successTitle, id.forgot.successBody, [
        { text: id.common.ok, onPress: () => navigation.replace("Login", { initialEmail: e }) }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.forgot.title}</Text>
      <Text style={styles.subtitle}>{id.forgot.subtitle}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View>
          <Text style={styles.label}>{id.forgot.emailLabel}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={id.forgot.emailPlaceholder}
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
          <Text style={styles.primaryButtonText}>{busy ? id.forgot.sending : id.forgot.send}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace("Login", { initialEmail: email.trim() })}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.forgot.backToLogin}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700" },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: lineHeights.relaxed,
  },
  label: { fontSize: typography.small, color: colors.text, fontWeight: "700", marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.card
  },
  primaryButton: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
