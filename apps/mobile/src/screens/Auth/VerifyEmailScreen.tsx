import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Linking, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, lineHeights, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { AUTH_CALLBACK, supabase } from "../../services/supabase";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { isRateLimitedError, logAuthRateLimitEvent } from "../../services/authSecurity";

const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

export default function VerifyEmailScreen({ route, navigation }: Props) {
  const email = route.params.email;
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && getWebViewport(viewportWidth) === "desktop";

  const canResend = useMemo(() => cooldown <= 0 && !busy, [cooldown, busy]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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

  async function resend() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: AUTH_CALLBACK,
        },
      });
      if (error) {
        if (isRateLimitedError(error.message)) {
          logAuthRateLimitEvent("verify_email_resend", { screen: "VerifyEmail", email_domain: email.split("@")[1] ?? "unknown" });
          Alert.alert(id.common.errorTitle, id.common.authRateLimited);
          return;
        }

        Alert.alert(id.common.errorTitle, id.common.genericAuthError);
        return;
      }
      setCooldown(60);
    } finally {
      setBusy(false);
    }
  }

  async function changeEmail() {
    await supabase.auth.signOut();
    navigation.replace("SignUp", { initialEmail: "" });
  }

  function iHaveVerified() {
    navigation.replace("Login", { initialEmail: email });
  }

  return (
    <AuthScreenLayout title={id.verify.title} subtitle={id.verify.subtitle}>
      <View style={authSharedStyles.formFields}>
        <Text style={styles.email}>{email}</Text>

        <Text style={styles.help}>
          Setelah klik tautan verifikasi, kembali ke aplikasi Wellness. Jika tautan tidak membuka aplikasi, tap “Saya
          sudah verifikasi” lalu masuk.
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
              hovered && isDesktopWeb && styles.secondaryButtonHover,
              pressed && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>{id.verify.iHaveVerified}</Text>
          </Pressable>

          <Pressable
            onPress={resend}
            disabled={!canResend}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              !canResend && authSharedStyles.disabled,
              hovered && isDesktopWeb && canResend && styles.secondaryButtonHover,
              pressed && canResend && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>
              {busy ? id.verify.resendBusy : cooldown > 0 ? `${id.verify.resendWait} ${cooldown}s` : id.verify.resend}
            </Text>
          </Pressable>

          <Pressable
            onPress={changeEmail}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              hovered && isDesktopWeb && styles.secondaryButtonHover,
              pressed && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>{id.verify.changeEmail}</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace("Login", { initialEmail: email })}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.secondaryButton,
              hovered && isDesktopWeb && styles.secondaryButtonHover,
              pressed && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>{id.verify.backToLogin}</Text>
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
  secondaryButtonHover: {
    backgroundColor: colors.secondaryHover,
  },
});
