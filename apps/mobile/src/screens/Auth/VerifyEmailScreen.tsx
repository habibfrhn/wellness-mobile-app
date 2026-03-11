import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Linking, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, lineHeights, spacing, typography, radius } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";

const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

export default function VerifyEmailScreen({ route, navigation }: Props) {
  const email = route.params.email;
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

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
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
        return;
      }
      setCooldown(30);
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
          <Pressable onPress={openEmailInbox} style={({ pressed }) => [authSharedStyles.primaryButton, pressed && authSharedStyles.pressed]}>
            <Text style={authSharedStyles.primaryButtonText}>{id.verify.openEmail}</Text>
          </Pressable>

          <Pressable onPress={iHaveVerified} style={({ pressed }) => [styles.primaryOutlineButton, pressed && authSharedStyles.pressed]}>
            <Text style={styles.primaryOutlineButtonText}>Saya sudah verifikasi</Text>
          </Pressable>

          <Pressable
            onPress={resend}
            disabled={!canResend}
            style={({ pressed }) => [
              authSharedStyles.secondaryButton,
              !canResend && authSharedStyles.disabled,
              pressed && canResend && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>
              {busy ? id.verify.resendBusy : cooldown > 0 ? `${id.verify.resendWait} ${cooldown}s` : id.verify.resend}
            </Text>
          </Pressable>

          <Pressable onPress={changeEmail} style={({ pressed }) => [authSharedStyles.secondaryButton, pressed && authSharedStyles.pressed]}>
            <Text style={authSharedStyles.secondaryButtonText}>{id.verify.changeEmail}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.replace("Login", { initialEmail: email })} style={({ pressed }) => [styles.linkButton, pressed && authSharedStyles.pressed]}>
            <Text style={styles.linkText}>{id.verify.backToLogin}</Text>
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
  primaryOutlineButton: {
    width: "100%",
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryOutlineButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  linkButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center",
  },
});
