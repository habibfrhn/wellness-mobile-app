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
import LoginBrandPanel from "../../components/auth/LoginBrandPanel";
import LoginSignUpPrompt from "../../components/auth/LoginSignUpPrompt";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

type LayoutProps = {
  children: React.ReactNode;
};


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
  const [rememberMe, setRememberMe] = useState(false);

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

      const verified = Boolean(data.user?.email_confirmed_at);
      if (!verified) {
        navigation.replace("VerifyEmail", { email: e });
        return;
      }
    } finally {
      setBusy(false);
    }
  }

  const content = (
    <View style={[styles.content, isDesktopWeb && styles.contentDesktop]}>
      <View style={styles.headerStack}>
        <Text style={styles.title}>{id.login.welcomeTitle}</Text>
        <Text style={styles.subtitle}>{id.login.welcomeSubtitle}</Text>
      </View>

      <View style={styles.formFields}>
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

        <LoginSignUpPrompt onPressSignUp={() => navigation.replace("SignUp", { initialEmail: email.trim() })} />
      </View>
    </View>
  );

  if (isDesktopWeb) {
    return <DesktopLayout>{content}</DesktopLayout>;
  }

  return <MobileLayout>{content}</MobileLayout>;
}

function MobileLayout({ children }: LayoutProps) {
  return <View style={styles.mobileOuter}>{children}</View>;
}

function DesktopLayout({ children }: LayoutProps) {
  return (
    <View style={styles.webOuter}>
      <View style={styles.webSplitLayout}>
        <View style={styles.webLeftColumn}>
          <View style={styles.webLeftContent}>
            <LoginBrandPanel />
          </View>
        </View>

        <View style={styles.webRightColumn}>
          <View style={styles.webPanel}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileOuter: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
  },
  webOuter: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  webSplitLayout: {
    width: "100%",
    maxWidth: 1200,
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 560,
  },
  webLeftColumn: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  webLeftContent: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    justifyContent: "center",
  },
  webRightColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  webPanel: {
    width: "100%",
    maxWidth: 440,
    padding: 36,
    borderRadius: 16,
    backgroundColor: colors.white,
    boxShadow: "0px 8px 28px rgba(33,50,94,0.12)",
  },
  content: {
    width: "100%",
  },
  contentDesktop: {
    width: "100%",
  },
  headerStack: {
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.h1,
    color: colors.text,
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
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
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
    backgroundColor: colors.white,
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
  },
  buttonDesktop: {
    minHeight: 52,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
