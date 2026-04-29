import React, { useLayoutEffect, useRef, useState } from "react";
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
import { colors, spacing, radius, typography, lineHeights } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { clearPendingProfileName } from "../../services/pendingProfileName";
import { supabase } from "../../services/supabase";
import { continueWithGoogle } from "../../services/authOAuth";
import PasswordToggle from "../../components/PasswordToggle";
import LoginSignUpPrompt from "../../components/auth/LoginSignUpPrompt";
import { getSafeAuthErrorMessage, isEmailNotConfirmedError, isInvalidCredentialsError } from "../../services/authSecurity";
import { isUserVerified } from "../../services/authProviders";
import { signOutToLogin } from "../../services/authSession";
import { logAuthDebugEvent } from "../../services/authDebug";

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
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const passwordInputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
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

  function togglePasswordVisibility() {
    setShowPassword((value) => !value);
    setTimeout(() => passwordInputRef.current?.focus(), 0);
  }

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
    setFormError(null);
    setBusy(true);
    try {
      logAuthDebugEvent("info", "login:start", {
        method: "password",
        screen: "login_native",
        emailDomain: e.split("@")[1] ?? null,
      });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      });

      logAuthDebugEvent(error ? "warn" : "info", "email_password_login_result", {
        screen: "login_native",
        emailDomain: e.split("@")[1] ?? null,
        ok: !error,
        error: error?.message ?? null,
        hasSession: Boolean(data.session),
        userId: data.user?.id ?? null,
      });

      if (error) {
        logAuthDebugEvent("warn", "login:error", {
          method: "password",
          screen: "login_native",
          error: error.message,
        });
        if (isEmailNotConfirmedError(error.message)) {
          navigation.replace("VerifyEmail", { email: e, context: "login_unverified" });
          return;
        }

        setErrors(isInvalidCredentialsError(error.message) ? { password: id.login.errorInvalidCredentials } : {});
        setFormError(getSafeAuthErrorMessage(error.message, id.common.genericAuthError));
        return;
      }

      const verified = isUserVerified(data.user);
      if (!verified) {
        await signOutToLogin();
        navigation.replace("VerifyEmail", { email: e, context: "login_unverified" });
        return;
      }
      logAuthDebugEvent("info", "login:success", {
        method: "password",
        screen: "login_native",
        userId: data.user?.id ?? null,
      });
      const rootNavigation = navigation.getParent();
      rootNavigation?.reset({
        index: 0,
        routes: [{ name: "App" as never }],
      });
    } catch (error) {
      logAuthDebugEvent("error", "login:error", {
        method: "password",
        screen: "login_native",
        error: error instanceof Error ? error.message : "unknown_error",
      });
      setFormError(id.common.genericAuthError);
    } finally {
      setBusy(false);
    }
  }

  async function onContinueWithGoogle() {
    if (busy || busyGoogle) {
      return;
    }

    setErrors((prev) => ({ ...prev, email: undefined }));
    setFormError(null);
    setBusyGoogle(true);
    try {
      logAuthDebugEvent("info", "oauth_google_start_requested", {
        screen: "login_native",
      });
      await clearPendingProfileName();
      await continueWithGoogle({ nextRoute: "Login" });
    } catch {
      Alert.alert(id.common.errorTitle, id.common.genericAuthError);
      setFormError(id.common.genericAuthError);
    } finally {
      setBusyGoogle(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.panel}>
        <View style={styles.headerStack}>
          <Text style={styles.title}>{id.login.welcomeTitle}</Text>
          <Text style={styles.subtitle}>{id.login.formSubtitle}</Text>
        </View>

        <View style={styles.formFields}>
          <View>
            <Text style={styles.label}>{id.login.emailLabel}</Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (formError) {
                  setFormError(null);
                }
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
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
                ref={passwordInputRef}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (formError) {
                    setFormError(null);
                  }
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                secureTextEntry={!showPassword}
                placeholder={id.login.passwordPlaceholder}
                placeholderTextColor={colors.mutedText}
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                onSubmitEditing={onSubmit}
                returnKeyType="go"
              />
              <PasswordToggle
                visible={showPassword}
                onPress={togglePasswordVisibility}
                accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
                style={styles.toggle}
              />
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <Pressable onPress={() => navigation.navigate("ForgotPassword", { initialEmail: email.trim() })}>
            <Text style={styles.metaLink}>Lupa password?</Text>
          </Pressable>
        </View>

        <View style={styles.actionsStack}>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <Pressable
            onPress={onSubmit}
            disabled={busy || busyGoogle}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || busyGoogle) && styles.disabled,
              pressed && !busy && !busyGoogle && styles.primaryButtonPressed,
            ]}
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
    backgroundColor: colors.white,
  },
  screenContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    padding: 36,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    boxShadow: "0px 8px 28px rgba(33,50,94,0.12)",
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
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.sm,
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
  formError: {
    color: colors.danger,
    fontSize: typography.caption,
    textAlign: "left",
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
  primaryButtonPressed: { backgroundColor: colors.primaryPressed },
  pressed: { opacity: 0.85 },
});
