import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { hasValidAuthRedirects } from "../../services/supabase";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { requestPasswordResetEmail } from "../../services/requestPasswordReset";
import { isValidAuthEmail, normalizeAuthEmail } from "../../services/authValidation";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [helperText, setHelperText] = useState<string | null>(null);
  const [helperTone, setHelperTone] = useState<"success" | "error" | null>(null);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = getWebViewport(viewportWidth) === "desktop";

  const normalizedEmail = useMemo(() => normalizeAuthEmail(email), [email]);
  const canSubmit = !busy;
  const emailWebInputProps =
    Platform.OS === "web" ? ({ id: "forgot-password-email", name: "email", nativeID: "forgot-password-email" } as const) : {};


  async function onSubmit() {
    const e = normalizedEmail;
    if (!e) {
      setHelperText(id.forgot.helperEmptyEmail);
      setHelperTone("error");
      return;
    }

    if (!isValidAuthEmail(e)) {
      setHelperText(id.forgot.helperInvalidEmail);
      setHelperTone("error");
      return;
    }

    setBusy(true);
    setLastSubmittedEmail(e);
    setHelperText(null);
    setHelperTone(null);
    try {
      if (!hasValidAuthRedirects) {
        Alert.alert(id.forgot.failedTitle, id.forgot.failedBody);
        return;
      }

      const result = await requestPasswordResetEmail(e);

      if (!result.ok) {
        if (result.code === "RATE_LIMITED") {
          setHelperText(id.forgot.resendHelperRateLimited);
          setHelperTone("error");
          return;
        }

        if (result.code === "RESET_REQUEST_FAILED") {
          setHelperText(id.forgot.helperOperationalError);
          setHelperTone("error");
          return;
        }

        setHelperText(id.forgot.helperOperationalError);
        setHelperTone("error");
        return;
      }

      setHelperText(id.forgot.helperSuccess);
      setHelperTone("success");
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
            onChangeText={(value) => {
              setEmail(value);
              const normalized = normalizeAuthEmail(value);
              if (normalized && normalized !== lastSubmittedEmail) {
                setHelperText(null);
                setHelperTone(null);
              }
            }}
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
              {busy ? id.forgot.sending : id.forgot.send}
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
