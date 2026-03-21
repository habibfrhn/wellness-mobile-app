import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { getWebPageHorizontalPadding, getWebPageTopSpacing, getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, spacing, radius, typography, lineHeights } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { clearPendingProfileName } from "../../services/pendingProfileName";
import { supabase } from "../../services/supabase";
import { continueWithGoogle } from "../../services/authOAuth";
import PasswordToggle from "../../components/PasswordToggle";
import LoginSignUpPrompt from "../../components/auth/LoginSignUpPrompt";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

type FieldErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function LoginScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const viewportWidth = useViewportWidth();
  const viewport = getWebViewport(viewportWidth);
  const isMobileWeb = viewport === "mobile";
  const isTabletWeb = viewport === "tablet";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerShadowVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate("Landing" as never);
              return;
            }
            navigation.navigate("Welcome");
          }}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={id.login.closeLabel}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  async function onSubmit() {
    if (busy) {
      return;
    }

    const e = email.trim().toLowerCase();
    const p = password;

    if (!e && !p) {
      setErrors({
        email: id.login.errorBothRequired,
        password: id.login.errorBothRequired,
      });
      return;
    }

    if (!e) {
      setErrors({ email: id.login.errorEmailRequired });
      return;
    }

    if (!p) {
      setErrors({ password: id.login.errorPasswordRequired });
      return;
    }

    if (!isValidEmail(e)) {
      setErrors({ email: id.common.invalidEmail });
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      });

      if (error) {
        setErrors({ password: id.login.errorInvalidCredentials });
        return;
      }

      const verified = Boolean(data.user?.email_confirmed_at);
      if (!verified) {
        navigation.replace("VerifyEmail", { email: e });
        return;
      }
    } finally {
      setBusy(false);
    }
  }

  async function onContinueWithGoogle() {
    if (busy || busyGoogle) {
      return;
    }

    setBusyGoogle(true);
    try {
      await clearPendingProfileName();
      await continueWithGoogle({ nextRoute: "Login" });
    } catch (error) {
      Alert.alert(id.common.errorTitle, error instanceof Error ? error.message : id.common.tryAgain);
      setBusyGoogle(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, { paddingHorizontal: getWebPageHorizontalPadding(viewport), paddingTop: getWebPageTopSpacing(viewport) }, isTabletWeb && styles.screenContentTablet, isMobileWeb && styles.screenContentMobile]}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.panel, isTabletWeb && styles.panelTablet, isMobileWeb && styles.panelMobile]}>
        <View style={styles.headerStack}>
          <Text style={[styles.title, isTabletWeb && styles.titleTablet, isMobileWeb && styles.titleMobile]}>{id.login.welcomeTitle}</Text>
          <Text style={styles.subtitle}>{id.login.formSubtitle}</Text>
        </View>

        <View style={styles.formFields}>
          <View>
            <Text style={styles.label}>{id.login.emailLabel}</Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={id.login.emailPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={[styles.input, errors.email && styles.inputError]}
              returnKeyType="next"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>{id.login.passwordLabel}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                placeholder={id.login.passwordPlaceholder}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                onSubmitEditing={onSubmit}
                returnKeyType="go"
              />
              <PasswordToggle
                visible={showPassword}
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
                style={styles.toggle}
              />
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <Pressable onPress={() => setRememberMe((v) => !v)} style={styles.rememberWrap}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe ? <View style={styles.checkboxInner} /> : null}
            </View>
            <Text style={styles.metaText}>Ingat saya</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate("ForgotPassword", { initialEmail: email.trim() })}>
            <Text style={styles.metaLink}>Lupa password?</Text>
          </Pressable>
        </View>

        <View style={styles.actionsStack}>
          <Pressable
            onPress={onSubmit}
            disabled={busy || busyGoogle}
            style={({ pressed }) => [styles.primaryButton, (busy || busyGoogle) && styles.disabled, pressed && !busy && !busyGoogle && styles.pressed]}
          >
            {busy ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.primaryButtonText}>{id.login.primaryCta}</Text>
            )}
          </Pressable>

          <GoogleAuthButton busy={busyGoogle} onPress={() => void onContinueWithGoogle()} />

          <LoginSignUpPrompt onPressSignUp={() => navigation.replace("SignUp", { initialEmail: email.trim() })} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  screenContentTablet: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  screenContentMobile: {
    justifyContent: "flex-start",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  panel: {
    width: "100%",
    maxWidth: 580,
    padding: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    boxShadow: "0px 8px 28px rgba(33,50,94,0.12)",
  },
  panelTablet: {
    maxWidth: 640,
    padding: spacing.xl,
  },
  panelMobile: {
    maxWidth: "100%",
    padding: spacing.md,
    boxShadow: "none",
    borderRadius: radius.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: typography.title,
    color: colors.text,
    fontWeight: "700",
  },
  headerStack: {
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.h1,
    color: colors.primary,
    fontWeight: "700",
    textAlign: "left",
  },
  titleTablet: {
    fontSize: 28,
  },
  titleMobile: {
    fontSize: typography.h2,
  },
  subtitle: {
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: lineHeights.relaxed,
    textAlign: "left",
  },
  formFields: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  inputWrap: { position: "relative", width: "100%" },
  input: {
    width: "100%",
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.mutedText,
    minHeight: 52,
  },
  passwordInput: {
    paddingRight: 52,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: typography.caption,
  },
  toggle: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  rememberWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.mutedText,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  checkboxChecked: {
    borderColor: colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: radius.xs,
    backgroundColor: colors.primary,
  },
  metaText: {
    fontSize: typography.small,
    color: colors.text,
  },
  metaLink: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: "600",
  },
  actionsStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: { opacity: 0.75 },
  pressed: { opacity: 0.85 },
});
