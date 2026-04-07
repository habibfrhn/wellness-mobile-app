import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/types";
import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { colors, radius, spacing, typography } from "../../theme/tokens";
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
  const missingPasswordRules = useMemo(() => {
    const missing: string[] = [];
    if (!passwordChecks.minLength) missing.push(id.signup.passwordMissingMin);
    if (!passwordChecks.maxLength) missing.push(id.signup.passwordMissingMax);
    if (!passwordChecks.uppercase) missing.push(id.signup.passwordMissingUpper);
    if (!passwordChecks.lowercase) missing.push(id.signup.passwordMissingLower);
    if (!passwordChecks.number) missing.push(id.signup.passwordMissingNumber);
    if (!passwordChecks.special) missing.push(id.signup.passwordMissingSpecial);
    return missing;
  }, [passwordChecks]);
  const strengthLevel = useMemo(() => {
    if (!password) {
      return 0;
    }

    if (isValidPassword(password)) {
      return 3;
    }

    const complexityMetCount = [passwordChecks.uppercase, passwordChecks.lowercase, passwordChecks.number, passwordChecks.special].filter(Boolean)
      .length;

    if (passwordChecks.minLength && passwordChecks.maxLength && complexityMetCount >= 3) {
      return 2;
    }

    return 1;
  }, [password, passwordChecks]);
  const hasStartedPasswordInput = password.length > 0;
  const passwordIsValid = hasStartedPasswordInput && isValidPassword(password);
  const passwordStatusText = useMemo(() => {
    if (!hasStartedPasswordInput) {
      return null;
    }

    if (passwordIsValid) {
      return id.signup.passwordValid;
    }

    return `${id.signup.passwordMissingPrefix} ${missingPasswordRules.join(", ")}`;
  }, [hasStartedPasswordInput, missingPasswordRules, passwordIsValid]);

  useEffect(() => {
    void trackEvent("signup_start", { method: "email" });
  }, []);

  function togglePasswordVisibility(ref: React.RefObject<TextInput | null>, setter: React.Dispatch<React.SetStateAction<boolean>>) {
    setter((value) => !value);

    if (Platform.OS === "web") {
      setTimeout(() => ref.current?.focus(), 0);
    }
  }

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

        <View>
          <Text style={authSharedStyles.label}>{id.signup.passwordLabel}</Text>
          <View style={authSharedStyles.inputWrap}>
            <TextInput
              ref={passwordInputRef}
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
              secureTextEntry={Platform.OS === "web" ? false : !showPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmInputRef.current?.focus()}
              placeholder={id.signup.passwordPlaceholder}
              placeholderTextColor={colors.mutedText}
              style={[
                authSharedStyles.input,
                styles.passwordInput,
                Platform.OS === "web" && !showPassword && ({ WebkitTextSecurity: "disc" } as any),
                errors.password && styles.passwordInputError,
              ]}
            />
            <PasswordToggle
              visible={showPassword}
              onPress={() => togglePasswordVisibility(passwordInputRef, setShowPassword)}
              accessibilityLabel={showPassword ? id.common.hidePassword : id.common.showPassword}
              style={styles.toggle}
            />
          </View>
          <View style={styles.passwordStrengthRow}>
            {[0, 1, 2].map((index) => (
              <View key={`strength-${index}`} style={[styles.passwordStrengthSegment, strengthLevel > index && styles.passwordStrengthSegmentActive]} />
            ))}
          </View>
          {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
          {passwordStatusText ? (
            <Text style={[styles.passwordStatusText, passwordIsValid ? styles.passwordStatusSuccess : styles.passwordStatusWarning]}>
              {passwordStatusText}
            </Text>
          ) : null}
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
          secureTextEntry={Platform.OS === "web" ? false : !showConfirm}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          placeholder={id.signup.confirmPasswordPlaceholder}
          errorText={errors.confirm}
          style={Platform.OS === "web" && !showConfirm ? ({ WebkitTextSecurity: "disc" } as any) : undefined}
          rightNode={
            <PasswordToggle
              visible={showConfirm}
              onPress={() => togglePasswordVisibility(confirmInputRef, setShowConfirm)}
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
  passwordStrengthRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  passwordInput: {
    paddingRight: spacing.xl + spacing.sm,
  },
  passwordInputError: {
    borderColor: colors.danger,
  },
  fieldErrorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: typography.caption,
  },
  passwordStrengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: "#D0D5DD",
  },
  passwordStrengthSegmentActive: {
    backgroundColor: colors.primary,
  },
  passwordStatusText: {
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  passwordStatusWarning: {
    color: colors.mutedText,
  },
  passwordStatusSuccess: {
    color: colors.primary,
    fontWeight: "600",
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
