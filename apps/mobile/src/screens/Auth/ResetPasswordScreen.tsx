import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return password.length >= 8 && confirm.length >= 8 && password === confirm && !busy;
  }, [password, confirm, busy]);

  async function onSubmit() {
    if (password.length < 8) {
      Alert.alert(id.common.weakPassword, id.common.weakPasswordBody);
      return;
    }
    if (password !== confirm) {
      Alert.alert(id.common.passwordsNotMatch, id.common.passwordsNotMatchBody);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
        return;
      }

      Alert.alert(id.reset.successTitle, id.reset.successBody, [
        {
          text: id.common.ok,
          onPress: async () => {
            // Security: sign out after password change, force re-login
            await supabase.auth.signOut();
            navigation.replace("Login");
          }
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.reset.title}</Text>
      <Text style={styles.subtitle}>{id.reset.subtitle}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{id.reset.newPassword}</Text>
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
            placeholder={id.reset.placeholderNew}
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{id.reset.confirmPassword}</Text>
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
            placeholder={id.reset.placeholderConfirm}
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
          <Text style={styles.primaryButtonText}>{busy ? id.reset.saving : id.reset.set}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace("Login")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
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
  label: { fontSize: typography.small, color: colors.text, fontWeight: "700", marginBottom: spacing.xs },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  linkButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  linkText: { color: colors.text, fontSize: typography.small, fontWeight: "700" },
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
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
