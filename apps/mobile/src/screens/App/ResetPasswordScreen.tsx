import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AppStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography, lineHeights } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { canManagePassword } from "../../services/authProviders";
import { signOutToLogin } from "../../services/authSession";
import { supabase } from "../../services/supabase";
import { PASSWORD_MAX_LENGTH, isValidPassword } from "../../services/authSecurity";
import PasswordToggle from "../../components/PasswordToggle";
import useViewportWidth from "../../hooks/useViewportWidth";
import { getWebViewport } from "../../constants/webLayout";

type Props = NativeStackScreenProps<AppStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordManagementReady, setPasswordManagementReady] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && getWebViewport(viewportWidth) === "desktop";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerTitle: "",
      headerStyle: {
        backgroundColor: colors.bg,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) {
        return;
      }

      if (error || !canManagePassword(data.user)) {
        Alert.alert(id.common.errorTitle, id.account.resetUnavailableBody, [
          {
            text: id.common.ok,
            onPress: () => navigation.goBack(),
          },
        ]);
        return;
      }

      setPasswordManagementReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [navigation]);

  const validationMessage = useMemo(() => {
    if (!passwordManagementReady) {
      return null;
    }

    if (!currentPassword.trim()) {
      return id.account.resetCurrentMissing;
    }

    if (!password) {
      return id.account.resetNewMissing;
    }

    if (!confirm) {
      return id.account.resetConfirmMissing;
    }

    if (!isValidPassword(password)) {
      return password.length > PASSWORD_MAX_LENGTH ? id.common.weakPasswordLongBody : id.common.weakPasswordBody;
    }

    if (password !== confirm) {
      return id.common.passwordsNotMatchBody;
    }

    return null;
  }, [passwordManagementReady, currentPassword, password, confirm]);

  useEffect(() => {
    setValidationFeedback(validationMessage);
  }, [validationMessage]);

  async function onSubmit() {
    if (busy) {
      return;
    }

    if (validationMessage) {
      setValidationFeedback(validationMessage);
      return;
    }

    setBusy(true);
    setValidationFeedback(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setValidationFeedback(id.common.tryAgain);
        return;
      }

      const email = userData.user?.email;
      if (!email) {
        setValidationFeedback(id.account.sessionMissing);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setValidationFeedback(id.account.resetCurrentInvalid);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setValidationFeedback(id.common.tryAgain);
        return;
      }

      await signOutToLogin();
    } finally {
      setBusy(false);
    }
  }

  if (!passwordManagementReady) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.formStack}>
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

        {validationFeedback ? <Text style={styles.validationHelperText}>{validationFeedback}</Text> : null}

        <Pressable
          onPress={onSubmit}
          style={({ hovered, pressed }: any) => [
            styles.primaryButton,
            hovered && isDesktopWeb && !busy && styles.primaryButtonHover,
            pressed && !busy && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? id.account.resetSaving : id.account.resetSave}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ hovered, pressed }: any) => [
            styles.secondaryButton,
            hovered && isDesktopWeb && styles.secondaryButtonHover,
            pressed && styles.secondaryButtonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>{id.account.resetBack}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  formStack: { marginTop: spacing.lg, gap: spacing.sm },
  label: { fontSize: typography.small, color: colors.text, fontWeight: "700", marginBottom: spacing.xs },
  inputWrap: { position: "relative" },
  input: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.card,
  },
  toggle: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  primaryButton: {
    marginTop: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonHover: { backgroundColor: colors.primaryHover },
  primaryButtonPressed: { backgroundColor: colors.primaryPressed },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: {
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonHover: {
    backgroundColor: colors.secondaryHover,
    borderColor: colors.text,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.secondaryPressed,
    borderColor: colors.text,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  validationHelperText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: typography.caption,
    lineHeight: lineHeights.normal,
    fontWeight: "600",
  },
});
