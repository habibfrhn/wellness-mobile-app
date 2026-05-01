import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase, AUTH_RESET, hasValidAuthRedirects } from "../../services/supabase";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { isRateLimitedError } from "../../services/authSecurity";
import { isValidAuthEmail, normalizeAuthEmail } from "../../services/authValidation";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

function isOperationalResetError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return (
    normalized.includes("redirect") ||
    normalized.includes("smtp") ||
    normalized.includes("email provider") ||
    normalized.includes("invalid") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout")
  );
}

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [helperText, setHelperText] = useState<string | null>(null);
  const [helperTone, setHelperTone] = useState<"success" | "error" | null>(null);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = getWebViewport(viewportWidth) === "desktop";

  const canSubmit = useMemo(() => isValidAuthEmail(email) && !busy && cooldownSeconds === 0, [email, busy, cooldownSeconds]);
  const emailWebInputProps =
    Platform.OS === "web" ? ({ id: "forgot-password-email", name: "email", nativeID: "forgot-password-email" } as const) : {};

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [cooldownSeconds]);

  async function onSubmit() {
    const e = normalizeAuthEmail(email);
    if (!isValidAuthEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }

    setBusy(true);
    setHelperText(null);
    setHelperTone(null);
    try {
      if (!hasValidAuthRedirects) {
        Alert.alert(id.forgot.failedTitle, id.forgot.failedBody);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: AUTH_RESET,
      });

      if (error) {
        if (isRateLimitedError(error.message)) {
          setCooldownSeconds(60);
          setHelperText(id.forgot.resendHelperRateLimited);
          setHelperTone("error");
          return;
        }

        if (isOperationalResetError(error.message)) {
          setHelperText(id.forgot.helperOperationalError);
          setHelperTone("error");
          return;
        }

        setHelperText(id.forgot.helperSuccess);
        setHelperTone("success");
        return;
      }

      setHelperText(id.forgot.helperSuccess);
      setHelperTone("success");
      setCooldownSeconds(15);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenLayout title={id.forgot.title} subtitle={id.forgot.subtitle}>
      <View style={authSharedStyles.formFields}>
        <View>
          <Text style={authSharedStyles.label}>{id.forgot.emailLabel}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            placeholder={id.forgot.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={authSharedStyles.input}
            {...(emailWebInputProps as any)}
          />
        </View>

        <View style={authSharedStyles.actionsStack}>
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.primaryButton,
              (!canSubmit || busy) && authSharedStyles.disabled,
              hovered && isDesktopWeb && canSubmit && styles.primaryButtonHover,
              pressed && canSubmit && styles.primaryButtonPressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>
              {busy ? id.forgot.sending : cooldownSeconds > 0 ? `${id.forgot.cooldown} ${cooldownSeconds}s` : id.forgot.send}
            </Text>
          </Pressable>
          {helperText ? <Text style={[styles.helperText, helperTone === "success" ? styles.helperTextSuccess : styles.helperTextError]}>{helperText}</Text> : null}

          <Pressable
            onPress={() => navigation.replace("Login", { initialEmail: email.trim() })}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              styles.outlineButton,
              hovered && isDesktopWeb && styles.outlineButtonHover,
              pressed && styles.outlineButtonPressed,
            ]}
          >
            <Text style={[authSharedStyles.secondaryButtonText, styles.outlineButtonText]}>{id.forgot.backToLogin}</Text>
          </Pressable>
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
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
    ...(Platform.OS === "web" ? { opacity: 0.95 } : null),
  },
  outlineButtonText: {
    color: colors.text,
  },
  helperText: {
    fontSize: 13,
    fontWeight: "600",
  },
  helperTextError: {
    color: colors.danger,
  },
  helperTextSuccess: {
    color: colors.primary,
  },
});
