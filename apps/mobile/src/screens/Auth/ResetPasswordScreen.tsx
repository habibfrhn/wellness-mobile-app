import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import PasswordToggle from "../../components/PasswordToggle";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { PASSWORD_MAX_LENGTH, getResetLinkErrorType, isRateLimitedError, isValidPassword } from "../../services/authSecurity";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = getWebViewport(viewportWidth) === "desktop";
  const hasPasswordMismatch = confirm.length > 0 && password !== confirm;
  const showPasswordMismatchError = hasPasswordMismatch && didAttemptSubmit;
  const newPasswordWebInputProps =
    Platform.OS === "web"
      ? ({ id: "reset-password-new", name: "new-password", nativeID: "reset-password-new" } as const)
      : {};
  const confirmPasswordWebInputProps =
    Platform.OS === "web"
      ? ({ id: "reset-password-confirm", name: "confirm-password", nativeID: "reset-password-confirm" } as const)
      : {};

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
    if (busy) {
      return;
    }

    setDidAttemptSubmit(true);

    if (!isValidPassword(password)) {
      if (password.length > PASSWORD_MAX_LENGTH) {
        Alert.alert(id.common.weakPassword, id.common.weakPasswordLongBody);
        return;
      }

      Alert.alert(id.common.weakPassword, id.common.weakPasswordBody);
      return;
    }

    if (hasPasswordMismatch) {
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

        const resetLinkError = getResetLinkErrorType(error.message);
        if (resetLinkError === "expired") {
          Alert.alert(id.reset.linkExpiredTitle, id.reset.linkExpiredBody, [
            { text: id.common.ok, onPress: () => navigation.replace("ForgotPassword") },
          ]);
          return;
        }

        if (resetLinkError === "used") {
          Alert.alert(id.reset.linkUsedTitle, id.reset.linkUsedBody, [
            { text: id.common.ok, onPress: () => navigation.replace("ForgotPassword") },
          ]);
          return;
        }

        if (resetLinkError === "invalid") {
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
              secureTextEntry={!showPassword}
              placeholder={id.reset.placeholderNew}
              placeholderTextColor={colors.mutedText}
              style={authSharedStyles.input}
              {...(newPasswordWebInputProps as any)}
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
              secureTextEntry={!showConfirm}
              placeholder={id.reset.placeholderConfirm}
              placeholderTextColor={colors.mutedText}
              style={authSharedStyles.input}
              {...(confirmPasswordWebInputProps as any)}
            />
            <PasswordToggle
              visible={showConfirm}
              onPress={() => setShowConfirm((v) => !v)}
              accessibilityLabel={showConfirm ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
          {showPasswordMismatchError ? <Text style={styles.validationErrorText}>{id.reset.passwordsNotMatchInline}</Text> : null}
        </View>

        <View style={authSharedStyles.actionsStack}>
          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.primaryButton,
              busy && authSharedStyles.disabled,
              hovered && isDesktopWeb && !busy && styles.primaryButtonHover,
              pressed && !busy && styles.primaryButtonPressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.reset.saving : id.reset.set}</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace("Login")}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              styles.outlineButton,
              hovered && isDesktopWeb && styles.outlineButtonHover,
              pressed && styles.outlineButtonPressed,
            ]}
          >
            <Text style={[authSharedStyles.secondaryButtonText, styles.outlineButtonText]}>{id.reset.backToLogin}</Text>
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
  validationErrorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButtonHover: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  outlineButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.text,
  },
  outlineButtonHover: {
    backgroundColor: colors.secondaryHover,
    borderColor: colors.text,
  },
  outlineButtonPressed: {
    backgroundColor: colors.secondaryPressed,
    borderColor: colors.text,
  },
  outlineButtonText: {
    color: colors.text,
  },
});
