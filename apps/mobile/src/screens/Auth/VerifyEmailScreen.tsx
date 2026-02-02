import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import * as Linking from "expo-linking";
import * as IntentLauncher from "expo-intent-launcher";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography, lineHeights } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

// Android Intent flags
const FLAG_ACTIVITY_NEW_TASK = 0x10000000; // 268435456 :contentReference[oaicite:2]{index=2}

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
        // Open the user's email app as its own task (outside our task),
        // so our app remains running and the user can return normally.
        await IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
          category: "android.intent.category.APP_EMAIL",
          flags: FLAG_ACTIVITY_NEW_TASK, // supported by expo-intent-launcher :contentReference[oaicite:3]{index=3}
        });
        return;
      }

      // iOS best-effort fallback
      const ok = await Linking.canOpenURL("mailto:");
      if (!ok) {
        Alert.alert(id.common.errorTitle, id.common.tryAgain);
        return;
      }
      await Linking.openURL("mailto:");
    } catch {
      // Last fallback
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
    // Fallback when the verification link does not deep-link back to the app (common in Expo Go).
    navigation.replace("Login", { initialEmail: email });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.verify.title}</Text>
      <Text style={styles.subtitle}>{id.verify.subtitle}</Text>
      <Text style={styles.email}>{email}</Text>

      <View style={{ marginTop: spacing.sm }}>
        <Text style={styles.help}>
          Setelah klik tautan verifikasi, kembali ke aplikasi Wellness.
          Jika tautan tidak membuka aplikasi, tap “Saya sudah verifikasi” lalu masuk.
        </Text>
      </View>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Pressable
          onPress={openEmailInbox}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>{id.verify.openEmail}</Text>
        </Pressable>

        <Pressable
          onPress={iHaveVerified}
          style={({ pressed }) => [styles.primaryOutlineButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryOutlineButtonText}>Saya sudah verifikasi</Text>
        </Pressable>

        <Pressable
          onPress={resend}
          disabled={!canResend}
          style={({ pressed }) => [
            styles.secondaryButton,
            !canResend && styles.disabled,
            pressed && canResend && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>
            {busy
              ? id.verify.resendBusy
              : cooldown > 0
              ? `${id.verify.resendWait} ${cooldown}s`
              : id.verify.resend}
          </Text>
        </Pressable>

        <Pressable
          onPress={changeEmail}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.verify.changeEmail}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace("Login", { initialEmail: email })}
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
        >
          <Text style={styles.linkText}>{id.verify.backToLogin}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700" },
  subtitle: { marginTop: spacing.xs, fontSize: typography.body, color: colors.mutedText },
  email: { marginTop: spacing.xs, fontSize: typography.body, color: colors.text, fontWeight: "700" },
  help: { fontSize: typography.small, color: colors.mutedText, lineHeight: lineHeights.normal },

  primaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },

  primaryOutlineButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  primaryOutlineButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },

  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },

  linkButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  linkText: { color: colors.text, fontSize: typography.small, fontWeight: "700", textAlign: "center" },

  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
