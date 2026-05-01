import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, lineHeights, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { resendVerificationEmail } from "../../services/authResend";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;


export default function VerifyEmailScreen({ route, navigation }: Props) {
  const email = route.params.email;
  const context = route.params.context ?? "signup";
  const [busy, setBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendHelperText, setResendHelperText] = useState<string | null>(null);
  const [resendHelperTone, setResendHelperTone] = useState<"success" | "default">("default");
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && getWebViewport(viewportWidth) === "desktop";

  const canResend = useMemo(() => !busy && cooldownSeconds === 0, [busy, cooldownSeconds]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [cooldownSeconds]);

  const attemptResend = useCallback(async () => {
    setResendHelperText(null);
    setResendHelperTone("default");
    setBusy(true);
    try {
      const result = await resendVerificationEmail(email);

      if (!result.ok) {
        if (result.code === "RATE_LIMITED") {
          setCooldownSeconds(Math.max(1, result.retryAfterSec));
          setResendHelperText(id.verify.resendHelperRateLimited);
          return;
        }

        if (result.code === "LINK_STILL_VALID") {
          setCooldownSeconds(Math.max(1, result.retryAfterSec));
          setResendHelperText(id.verify.resendHelperLinkStillValid);
          return;
        }

        const errorMessage =
          result.code === "UNAVAILABLE"
            ? id.common.tryAgain
            : result.code === "MISCONFIGURED"
              ? id.forgot.failedBody
              : id.common.genericAuthError;
        Alert.alert(id.common.errorTitle, errorMessage);
        return;
      }

      setCooldownSeconds(Math.max(1, result.cooldownSec));
      setResendHelperText(id.verify.resendSuccessInline);
      setResendHelperTone("success");
    } finally {
      setBusy(false);
    }
  }, [email]);

  function iHaveVerified() {
    navigation.replace("Login", { initialEmail: email });
  }

  return (
    <AuthScreenLayout title={id.verify.title} subtitle={id.verify.subtitle}>
      <View style={authSharedStyles.formFields}>
        <Text style={styles.email}>{email}</Text>

        <Text style={styles.help}>
          {context === "signup" ? id.verify.helpSignup : id.verify.helpLogin}
        </Text>

        <View style={authSharedStyles.actionsStack}>
          <Pressable
            onPress={iHaveVerified}
            style={({ hovered, pressed }: any) => [authSharedStyles.primaryButton, hovered && isDesktopWeb && styles.primaryButtonHover, pressed && authSharedStyles.pressed]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{id.verify.iHaveVerified}</Text>
          </Pressable>

          <Pressable
            onPress={() => void attemptResend()}
            disabled={!canResend}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              styles.outlineButton,
              !canResend && authSharedStyles.disabled,
              hovered && isDesktopWeb && canResend && styles.outlineButtonHover,
              pressed && canResend && authSharedStyles.pressed,
            ]}
          >
            <Text style={[authSharedStyles.secondaryButtonText, styles.outlineButtonText]}>
              {busy
                ? id.verify.resendBusy
                : cooldownSeconds > 0
                  ? `${id.verify.resendWait} ${cooldownSeconds}s`
                  : id.verify.resend}
            </Text>
          </Pressable>
          {resendHelperText ? (
            <Text style={[styles.resendHelperText, resendHelperTone === "success" ? styles.resendHelperSuccess : styles.resendHelperDefault]}>
              {resendHelperText}
            </Text>
          ) : null}
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  email: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  help: {
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: lineHeights.normal,
  },
  primaryButtonHover: {
    backgroundColor: colors.primaryHover,
  },
  outlineButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.text,
  },
  outlineButtonText: {
    color: colors.text,
  },
  outlineButtonHover: {
    backgroundColor: colors.secondaryHover,
  },
  resendHelperText: {
    fontSize: typography.caption,
    lineHeight: lineHeights.normal,
  },
  resendHelperDefault: {
    color: colors.mutedText,
  },
  resendHelperSuccess: {
    color: colors.primary,
  },
});
