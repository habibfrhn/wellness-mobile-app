import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AppStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import { setNextAuthRoute } from "../../services/authStart";
import PasswordToggle from "../../components/PasswordToggle";

type Props = NativeStackScreenProps<AppStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      password.length >= 8 &&
      confirm.length >= 8 &&
      password === confirm &&
      !busy
    );
  }, [currentPassword, password, confirm, busy]);

  async function onSubmit() {
    if (!currentPassword.trim()) {
      Alert.alert(id.common.errorTitle, id.account.resetCurrentMissing);
      return;
    }
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        Alert.alert(id.common.errorTitle, userError.message);
        return;
      }

      const email = userData.user?.email;
      if (!email) {
        Alert.alert(id.common.errorTitle, id.account.sessionMissing);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert(id.common.errorTitle, signInError.message);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        Alert.alert(id.common.errorTitle, updateError.message);
        return;
      }

      await setNextAuthRoute("Login");
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.account.resetTitle}</Text>
      <Text style={styles.subtitle}>{id.account.resetSubtitle}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View>
          <Text style={styles.label}>{id.account.currentPasswordLabel}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showCurrent}
              placeholder={id.account.currentPasswordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={styles.input}
            />
            <PasswordToggle
              visible={showCurrent}
              onPress={() => setShowCurrent((v) => !v)}
              accessibilityLabel={showCurrent ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>{id.account.newPasswordLabel}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              placeholder={id.account.newPasswordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={styles.input}
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
          <Text style={styles.label}>{id.account.confirmPasswordLabel}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showConfirm}
              placeholder={id.account.confirmPasswordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={styles.input}
            />
            <PasswordToggle
              visible={showConfirm}
              onPress={() => setShowConfirm((v) => !v)}
              accessibilityLabel={showConfirm ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            (!canSubmit || busy) && styles.disabled,
            pressed && canSubmit && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? id.account.resetSaving : id.account.resetSave}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.account.resetBack}</Text>
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
  inputWrap: { position: "relative" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.secondary,
  },
  toggle: {
    position: "absolute",
    right: spacing.sm,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
