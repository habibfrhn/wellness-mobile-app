import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import PasswordToggle from "../../components/PasswordToggle";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { PASSWORD_MAX_LENGTH, isRateLimitedError, isValidPassword } from "../../services/authSecurity";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidPassword(password) && password === confirm && !busy;
  }, [password, confirm, busy]);

  React.useEffect(() => {
    let cancelled = false;

    const validateRecoverySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || data.session?.user) {
        return;
      }

      Alert.alert(id.reset.linkInvalidTitle, id.reset.linkInvalidBody, [
        {
          text: id.common.ok,
          onPress: () => navigation.replace("ForgotPassword"),
        },
      ]);
    };

    void validateRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  async function onSubmit() {
    if (!isValidPassword(password)) {
      if (password.length > PASSWORD_MAX_LENGTH) {
        Alert.alert(id.common.weakPassword, id.common.weakPasswordLongBody);
        return;
      }

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
        if (isRateLimitedError(error.message)) {
          Alert.alert(id.common.errorTitle, id.common.authRateLimited);
          return;
        }

        const message = (error.message ?? "").toLowerCase();
        if (message.includes("expired")) {
          Alert.alert(id.reset.linkExpiredTitle, id.reset.linkExpiredBody, [
            { text: id.common.ok, onPress: () => navigation.replace("ForgotPassword") },
          ]);
          return;
        }

        if (
          message.includes("invalid") ||
          message.includes("not found") ||
          message.includes("session") ||
          message.includes("jwt")
        ) {
          Alert.alert(id.reset.linkInvalidTitle, id.reset.linkInvalidBody, [
            { text: id.common.ok, onPress: () => navigation.replace("ForgotPassword") },
          ]);
          return;
        }

        Alert.alert(id.common.errorTitle, id.common.genericAuthError, [{ text: id.common.ok }]);
        return;
      }

      await supabase.auth.signOut();
      Alert.alert(id.reset.successTitle, id.reset.successBody, [{ text: id.common.ok, onPress: () => navigation.replace("Login") }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenLayout title={id.reset.title} subtitle={id.reset.subtitle}>
      <View style={authSharedStyles.formFields}>
        <View>
          <Text style={authSharedStyles.label}>{id.reset.newPassword}</Text>
          <View style={authSharedStyles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              secureTextEntry={!showPassword}
              placeholder={id.reset.placeholderNew}
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
          <Text style={authSharedStyles.label}>{id.reset.confirmPassword}</Text>
          <View style={authSharedStyles.inputWrap}>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              secureTextEntry={!showConfirm}
              placeholder={id.reset.placeholderConfirm}
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
            disabled={!canSubmit}
            style={({ pressed }) => [
              authSharedStyles.primaryButton,
              (!canSubmit || busy) && authSharedStyles.disabled,
              pressed && canSubmit && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.reset.saving : id.reset.set}</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace("Login")}
            style={({ pressed }) => [authSharedStyles.secondaryButton, pressed && authSharedStyles.pressed]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>{id.reset.backToLogin}</Text>
          </Pressable>
        </View>
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
});
