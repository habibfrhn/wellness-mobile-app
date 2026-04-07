import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [busy, setBusy] = useState(false);
  const hasAutoSentRef = useRef(false);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && getWebViewport(viewportWidth) === "desktop";

  const canResend = useMemo(() => !busy, [busy]);

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

  const attemptResend = useCallback(async (trigger: "auto" | "manual") => {
    setBusy(true);
    try {
      const result = await resendVerificationEmail(email);
      if (__DEV__) {
        console.log("VerifyEmailScreen: resend result", { trigger, code: result.ok ? "OK" : result.code });
      }

      if (!result.ok) {
        if (result.code === "RATE_LIMITED") {
          Alert.alert(id.common.errorTitle, id.verify.resendRateLimited);
          return;
        }

        if (result.code === "LINK_STILL_VALID") {
          Alert.alert(id.verify.linkStillValidTitle, id.verify.linkStillValidBody);
          return;
        }

        const errorMessage = result.code === "UNAVAILABLE" ? id.common.tryAgain : id.common.genericAuthError;
        Alert.alert(id.common.errorTitle, errorMessage);
        return;
      }

      Alert.alert(id.verify.resendSuccessTitle, id.verify.resendSuccessBody);
    } finally {
      setBusy(false);
    }
  }, [email]);

  useEffect(() => {
    if (hasAutoSentRef.current) {
      return;
    }

    hasAutoSentRef.current = true;
    void attemptResend("auto");
  }, [attemptResend]);

  function iHaveVerified() {
    navigation.replace("Login", { initialEmail: email });
  }

  return (
    <AuthScreenLayout title={id.verify.title} subtitle={id.verify.subtitle}>
      <View style={authSharedStyles.formFields}>
        <Text style={styles.email}>{email}</Text>

        <Text style={styles.help}>
          {id.verify.help}
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
            onPress={() => void attemptResend("manual")}
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
              {busy ? id.verify.resendBusy : id.verify.resend}
            </Text>
          </Pressable>
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
});
