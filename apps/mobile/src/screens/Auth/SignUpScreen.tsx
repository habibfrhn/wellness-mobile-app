import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, spacing, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { clearPendingProfileName, setPendingProfileName } from "../../services/pendingProfileName";
import { supabase, AUTH_CALLBACK } from "../../services/supabase";
import { continueWithGoogle } from "../../services/authOAuth";
import PasswordToggle from "../../components/PasswordToggle";
import AuthScreenLayout, { authSharedStyles } from "../../components/auth/AuthScreenLayout";
import AuthTextField from "../../components/auth/AuthTextField";
import SignUpLoginPrompt from "../../components/auth/SignUpLoginPrompt";
import { trackEvent } from "../../services/analytics";
import {
  PASSWORD_MAX_LENGTH,
  getPasswordRequirementChecks,
  isValidPassword,
  getSafeAuthErrorMessage,
  isEmailAlreadyRegisteredError,
  isRateLimitedError,
  isWeakPasswordError,
} from "../../services/authSecurity";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;
type FieldErrors = {
  email?: string;
  password?: string;
  confirm?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function isExistingUserSignupResponse(identities: unknown) {
  return Array.isArray(identities) && identities.length === 0;
}

export default function SignUpScreen({ navigation, route }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(route.params?.initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmInputRef = useRef<TextInput>(null);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && getWebViewport(viewportWidth) === "desktop";

  const canPress = useMemo(() => !busy, [busy]);
  const passwordChecks = useMemo(() => getPasswordRequirementChecks(password), [password]);

  useEffect(() => {
    void trackEvent("signup_start", { method: "email" });
  }, []);

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    const e = email.trim().toLowerCase();

    if (!e) {
      nextErrors.email = id.login.errorEmailRequired;
    } else if (!isValidEmail(e)) {
      nextErrors.email = id.common.invalidEmail;
    }

    if (!password) {
      nextErrors.password = id.login.errorPasswordRequired;
    } else if (!isValidPassword(password)) {
      nextErrors.password = password.length > PASSWORD_MAX_LENGTH ? id.common.weakPasswordLongBody : id.common.weakPasswordBody;
    }

    if (!confirm) {
      nextErrors.confirm = "Ulangi kata sandi belum diisi";
    } else if (password && password !== confirm) {
      nextErrors.confirm = "Kata sandi dan konfirmasi tidak sama.";
    }

    return nextErrors;
  }

  async function onSubmit() {
    if (busy || busyGoogle) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setFormError(null);

    const e = email.trim().toLowerCase();
    const trimmedName = name.trim();

    setBusy(true);
    try {
      await clearPendingProfileName();
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: {
          emailRedirectTo: AUTH_CALLBACK,
          data: trimmedName ? { full_name: trimmedName } : undefined,
        },
      });

      if (error) {
        if (isWeakPasswordError(error.message)) {
          setErrors((prev) => ({
            ...prev,
            password: password.length > PASSWORD_MAX_LENGTH ? id.common.weakPasswordLongBody : id.common.weakPasswordBody,
          }));
          passwordInputRef.current?.focus();
          return;
        }

        if (isEmailAlreadyRegisteredError(error.message)) {
          setErrors((prev) => ({ ...prev, email: id.signup.emailAlreadyUsedError }));
          emailInputRef.current?.focus();
          return;
        }

        const safeMessage = isRateLimitedError(error.message)
          ? id.common.authRateLimited
          : getSafeAuthErrorMessage(error.message, id.common.genericAuthError);
        setFormError(safeMessage);
        return;
      }

      if (isExistingUserSignupResponse(data.user?.identities)) {
        setErrors((prev) => ({ ...prev, email: id.signup.emailAlreadyUsedError }));
        emailInputRef.current?.focus();
        return;
      }

      void trackEvent("signup_complete", { method: "email" });
      navigation.replace("VerifyEmail", { email: e });
    } catch {
      setFormError(id.common.genericAuthError);
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
      await setPendingProfileName(name);
      await continueWithGoogle({ nextRoute: "SignUp" });
    } catch {
      setFormError(id.common.genericAuthError);
      setBusyGoogle(false);
    }
  }

  return (
    <AuthScreenLayout title={id.signup.title} subtitle={id.signup.subtitle}>
      <View style={authSharedStyles.formFields}>
        <AuthTextField
          label={id.signup.nameLabel}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailInputRef.current?.focus()}
          placeholder={id.signup.namePlaceholder}
        />
        <AuthTextField
          ref={emailInputRef}
          label={id.signup.emailLabel}
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
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          placeholder={id.signup.emailPlaceholder}
          errorText={errors.email}
        />

        <AuthTextField
          ref={passwordInputRef}
          label={id.signup.passwordLabel}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (formError) {
              setFormError(null);
            }
            if (errors.password || errors.confirm) {
              setErrors((prev) => ({ ...prev, password: undefined, confirm: undefined }));
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          textContentType="newPassword"
          secureTextEntry={!showPassword}
          returnKeyType="next"
          onSubmitEditing={() => confirmInputRef.current?.focus()}
          placeholder={id.signup.passwordPlaceholder}
          errorText={errors.password}
          rightNode={
            <PasswordToggle
              visible={showPassword}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          }
        />
        <View style={styles.passwordRules}>
          <Text style={styles.passwordRulesTitle}>{id.signup.passwordRuleTitle}</Text>
          <Text style={[styles.passwordRuleItem, passwordChecks.minLength ? styles.passwordRuleMet : styles.passwordRuleUnmet]}>
            {passwordChecks.minLength ? "✓" : "○"} {id.signup.passwordRuleMin}
          </Text>
          <Text style={[styles.passwordRuleItem, passwordChecks.maxLength ? styles.passwordRuleMet : styles.passwordRuleUnmet]}>
            {passwordChecks.maxLength ? "✓" : "○"} {id.signup.passwordRuleMax}
          </Text>
          <Text style={[styles.passwordRuleItem, passwordChecks.uppercase ? styles.passwordRuleMet : styles.passwordRuleUnmet]}>
            {passwordChecks.uppercase ? "✓" : "○"} {id.signup.passwordRuleUppercase}
          </Text>
          <Text style={[styles.passwordRuleItem, passwordChecks.lowercase ? styles.passwordRuleMet : styles.passwordRuleUnmet]}>
            {passwordChecks.lowercase ? "✓" : "○"} {id.signup.passwordRuleLowercase}
          </Text>
          <Text style={[styles.passwordRuleItem, passwordChecks.number ? styles.passwordRuleMet : styles.passwordRuleUnmet]}>
            {passwordChecks.number ? "✓" : "○"} {id.signup.passwordRuleNumber}
          </Text>
          <Text style={[styles.passwordRuleItem, passwordChecks.special ? styles.passwordRuleMet : styles.passwordRuleUnmet]}>
            {passwordChecks.special ? "✓" : "○"} {id.signup.passwordRuleSpecial}
          </Text>
        </View>

        <AuthTextField
          ref={confirmInputRef}
          label={id.signup.confirmPasswordLabel}
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            if (formError) {
              setFormError(null);
            }
            if (errors.confirm) {
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          textContentType="newPassword"
          secureTextEntry={!showConfirm}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          placeholder={id.signup.confirmPasswordPlaceholder}
          errorText={errors.confirm}
          rightNode={
            <PasswordToggle
              visible={showConfirm}
              onPress={() => setShowConfirm((v) => !v)}
              accessibilityLabel={showConfirm ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          }
        />

        <View style={authSharedStyles.actionsStack}>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <Pressable
            onPress={onSubmit}
            disabled={!canPress || busyGoogle}
            style={({ hovered, pressed }: any) => [
              authSharedStyles.primaryButton,
              (!canPress || busyGoogle) && authSharedStyles.disabled,
              hovered && isDesktopWeb && canPress && !busyGoogle && styles.primaryButtonHover,
              pressed && canPress && !busyGoogle && styles.primaryButtonPressed,
            ]}
          >
            <Text style={authSharedStyles.primaryButtonText}>{busy ? id.signup.busyCta : id.signup.primaryCta}</Text>
          </Pressable>

          <GoogleAuthButton busy={busyGoogle} onPress={() => void onContinueWithGoogle()} />

          <SignUpLoginPrompt onPressLogin={() => navigation.replace("Login", { initialEmail: email.trim() })} />
        </View>

        <Text style={styles.finePrint}>{id.signup.finePrint}</Text>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  toggle: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  finePrint: {
    color: colors.mutedText,
    fontSize: typography.caption,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  passwordRules: {
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  passwordRulesTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  passwordRuleItem: {
    fontSize: typography.caption,
  },
  passwordRuleMet: {
    color: colors.primary,
  },
  passwordRuleUnmet: {
    color: colors.mutedText,
  },
  formError: {
    color: colors.danger,
    fontSize: typography.caption,
    textAlign: "left",
  },
  primaryButtonHover: {
    backgroundColor: colors.primaryHover,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
});
