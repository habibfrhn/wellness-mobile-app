import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography, lineHeights } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import PasswordToggle from "../../components/PasswordToggle";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function LoginScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length > 0 && !busy;
  }, [email, password, busy]);

  async function onSubmit() {
    const e = email.trim().toLowerCase();

    if (!isValidEmail(e)) {
      Alert.alert(id.common.invalidEmail, id.common.invalidEmailBody);
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password,
      });

      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
        return;
      }

      // If not verified, keep user in auth flow
      const verified = Boolean(data.user?.email_confirmed_at);
      if (!verified) {
        navigation.replace("VerifyEmail", { email: e });
        return;
      }

      // App.tsx will route verified users to AppStack automatically.
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <>
      <Text style={[styles.title, isDesktopWeb && styles.titleDesktop]}>{id.login.title}</Text>
      <Text style={[styles.subtitle, isDesktopWeb && styles.subtitleDesktop]}>{id.login.subtitle}</Text>

      <View style={[styles.formStack, isDesktopWeb && styles.formStackDesktop]}>
        <View>
          <Text style={styles.label}>{id.login.emailLabel}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder={id.login.emailPlaceholder}
            placeholderTextColor={colors.mutedText}
            style={[styles.input, isDesktopWeb && styles.inputDesktop]}
          />
        </View>

        <View>
          <Text style={styles.label}>{id.login.passwordLabel}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              placeholder={id.login.passwordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={[styles.input, isDesktopWeb && styles.inputDesktop]}
            />
            <PasswordToggle
              visible={showPassword}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            isDesktopWeb && styles.buttonDesktop,
            (!canSubmit || busy) && styles.disabled,
            pressed && canSubmit && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>{busy ? id.login.busyCta : id.login.primaryCta}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("ForgotPassword", { initialEmail: email.trim() })}
          style={({ pressed }) => [styles.secondaryButton, isDesktopWeb && styles.buttonDesktop, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.login.forgot}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.replace("SignUp", { initialEmail: email.trim() })}
          style={({ pressed }) => [styles.secondaryButton, isDesktopWeb && styles.buttonDesktop, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.login.create}</Text>
        </Pressable>
      </View>
    </>
  );

  if (isDesktopWeb) {
    return (
      <View style={styles.webOuter}>
        <View style={styles.webPanel}>{content}</View>
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  webOuter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  webPanel: {
    width: "100%",
    maxWidth: 520,
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700" },
  titleDesktop: {
    fontSize: typography.h1,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: lineHeights.relaxed,
  },
  subtitleDesktop: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  formStack: { marginTop: spacing.lg, gap: spacing.sm },
  formStackDesktop: { marginTop: spacing.xl, gap: spacing.md },
  label: { fontSize: typography.small, color: colors.text, fontWeight: "700", marginBottom: spacing.xs },
  inputWrap: { position: "relative" },
  input: {
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.card,
  },
  inputDesktop: {
    minHeight: 52,
  },
  toggle: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  buttonDesktop: {
    minHeight: 52,
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  secondaryButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.secondary },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
