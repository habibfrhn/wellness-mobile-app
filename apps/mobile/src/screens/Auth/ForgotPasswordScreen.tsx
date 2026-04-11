import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase, AUTH_RESET } from "../../services/supabase";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { isRateLimitedError } from "../../services/authSecurity";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = getWebViewport(viewportWidth) === "desktop";

  const canSubmit = useMemo(() => isValidEmail(email) && !busy && cooldownSeconds === 0, [email, busy, cooldownSeconds]);

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
    const e = email.trim().toLowerCase();
    if (!isValidEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: AUTH_RESET,
      });

      if (error) {
        if (isRateLimitedError(error.message)) {
          Alert.alert(id.common.errorTitle, id.common.authRateLimited);
          setCooldownSeconds(60);
          return;
        }

        Alert.alert(id.forgot.successTitle, id.forgot.successBody, [
          { text: id.common.ok, onPress: () => navigation.replace("Login", { initialEmail: e }) },
        ]);
        return;
      }

      Alert.alert(id.forgot.successTitle, id.forgot.successBody, [
        { text: id.common.ok, onPress: () => navigation.replace("Login", { initialEmail: e }) },
      ]);
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
            textContentType="emailAddress"
            placeholder={id.forgot.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={authSharedStyles.input}
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
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.forgot.sending : id.forgot.send}</Text>
          </Pressable>

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
});
