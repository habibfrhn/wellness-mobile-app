import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase, AUTH_RESET } from "../../services/supabase";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import { isRateLimitedError } from "../../services/authSecurity";
import TurnstileCaptcha from "../../components/auth/TurnstileCaptcha";
import { isTurnstileEnabled } from "../../services/authCaptcha";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetNonce, setCaptchaResetNonce] = useState(0);
  const captchaEnabled = isTurnstileEnabled();

  const canSubmit = useMemo(() => isValidEmail(email) && !busy, [email, busy]);

  async function onSubmit() {
    const e = email.trim().toLowerCase();
    if (!isValidEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }
    if (captchaEnabled && !captchaToken) {
      Alert.alert(id.common.errorTitle, id.common.captchaRequired);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo: AUTH_RESET,
        captchaToken: captchaToken ?? undefined,
      });

      if (error) {
        if (isRateLimitedError(error.message)) {
          Alert.alert(id.common.errorTitle, id.common.authRateLimited);
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
    } finally {
      setBusy(false);
      if (captchaEnabled) {
        setCaptchaResetNonce((value) => value + 1);
      }
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
            placeholder={id.forgot.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={authSharedStyles.input}
          />
        </View>

        <View style={authSharedStyles.actionsStack}>
          {captchaEnabled ? <TurnstileCaptcha onTokenChange={setCaptchaToken} resetNonce={captchaResetNonce} /> : null}
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              authSharedStyles.primaryButton,
              (!canSubmit || busy) && authSharedStyles.disabled,
              pressed && canSubmit && authSharedStyles.pressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.forgot.sending : id.forgot.send}</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.replace("Login", { initialEmail: email.trim() })}
            style={({ pressed }) => [authSharedStyles.secondaryButton, pressed && authSharedStyles.pressed]}
          >
            <Text style={authSharedStyles.secondaryButtonText}>{id.forgot.backToLogin}</Text>
          </Pressable>
        </View>
      </View>
    </AuthScreenLayout>
  );
}
