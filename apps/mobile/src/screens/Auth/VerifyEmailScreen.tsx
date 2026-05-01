import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Linking, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, lineHeights, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { resendVerificationEmail } from "../../services/authResend";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";

const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;


export default function VerifyEmailScreen({ route, navigation }: Props) {
  const email = route.params.email;
  const context = route.params.context ?? "signup";
  const [busy, setBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendHelperText, setResendHelperText] = useState<string | null>(
    context === "signup" ? id.verify.initialHelperSignup : id.verify.initialHelperLogin
  );
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

  async function openEmailInbox() {
    try {
      if (Platform.OS === "android") {
        const IntentLauncher = await import("expo-intent-launcher");
        await IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
          category: "android.intent.category.APP_EMAIL",
          flags: FLAG_ACTIVITY_NEW_TASK,
        });
        return;
      }

      const ok = await Linking.canOpenURL("mailto:");
      if (!ok) {
        Alert.alert(id.common.errorTitle, id.common.tryAgain);
        return;
      }
      await Linking.openURL("mailto:");
    } catch {
      try {
        await Linking.openURL("mailto:");
      } catch {
        Alert.alert(id.common.errorTitle, id.common.tryAgain);
      }
    }
  }

  const attemptResend = useCallback(async () => {
    setResendHelperText(null);
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
      setResendHelperText(id.verify.resendHelperInboxSpam);
      Alert.alert(id.verify.resendSuccessTitle, id.verify.resendSuccessBody);
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
            onPress={openEmailInbox}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.primaryButton,
              hovered && isDesktopWeb && styles.primaryButtonHover,
              pressed && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{id.verify.openEmail}</Text>
          </Pressable>

          <Pressable
            onPress={iHaveVerified}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              styles.outlineButton,
              hovered && isDesktopWeb && styles.outlineButtonHover,
              pressed && authSharedStyles.pressed,
            ]}
          >
            <Text style={[authSharedStyles.secondaryButtonText, styles.outlineButtonText]}>{id.verify.iHaveVerified}</Text>
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
          {resendHelperText ? <Text style={styles.resendHelperText}>{resendHelperText}</Text> : null}
          <Pressable
            onPress={() => navigation.replace("Login", { initialEmail: email })}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              styles.outlineButton,
              hovered && isDesktopWeb && styles.outlineButtonHover,
              pressed && authSharedStyles.pressed,
            ]}
          >
            <Text style={[authSharedStyles.secondaryButtonText, styles.outlineButtonText]}>{id.verify.backToLogin}</Text>
          </Pressable>
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
    color: colors.danger,
    lineHeight: lineHeights.normal,
  },
});
