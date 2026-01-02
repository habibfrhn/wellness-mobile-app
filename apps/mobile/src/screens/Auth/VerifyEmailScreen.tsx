import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as Linking from "expo-linking";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

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

  async function openEmailApp() {
    try {
      const ok = await Linking.canOpenURL("mailto:");
      if (!ok) {
        Alert.alert(id.common.errorTitle, id.common.tryAgain);
        return;
      }
      await Linking.openURL("mailto:");
    } catch {
      Alert.alert(id.common.errorTitle, id.common.tryAgain);
    }
  }

  async function resend() {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email
      });

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
    // MVP decision: re-signup with a new email (simplest, least risky).
    await supabase.auth.signOut();
    navigation.replace("SignUp", { initialEmail: "" });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.verify.title}</Text>
      <Text style={styles.subtitle}>{id.verify.subtitle}</Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.help}>{id.verify.help}</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Pressable onPress={openEmailApp} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{id.verify.openEmail}</Text>
        </Pressable>

        <Pressable
          onPress={resend}
          disabled={!canResend}
          style={({ pressed }) => [
            styles.secondaryButton,
            !canResend && styles.disabled,
            pressed && canResend && styles.pressed
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

        <Pressable onPress={changeEmail} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
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
  help: { marginTop: spacing.sm, fontSize: typography.small, color: colors.mutedText, lineHeight: 20 },
  primaryButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.primary },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  linkButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  linkText: { color: colors.text, fontSize: typography.small, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
