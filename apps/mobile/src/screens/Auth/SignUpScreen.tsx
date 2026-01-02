import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { supabase, AUTH_CALLBACK } from "../../services/supabase";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function SignUpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 8 && !busy;
  }, [email, password, busy]);

  async function onSubmit() {
    const e = email.trim().toLowerCase();

    if (!isValidEmail(e)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: {
          emailRedirectTo: AUTH_CALLBACK
        }
      });

      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }

      // Supabase may or may not create a session immediately depending on settings;
      // we still enforce verification before playback.
      navigation.replace("VerifyEmail", { email: e });
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Verify once. Then you can play tonight.</Text>

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <View>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            (!canSubmit || busy) && styles.disabled,
            pressed && canSubmit && styles.pressed
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? "Creating account..." : "Create account"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Already have an account? Log in</Text>
        </Pressable>

        <Text style={styles.finePrint}>
          By continuing, you agree to the Terms and Privacy Policy.
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    justifyContent: "center"
  },
  title: {
    fontSize: typography.h2,
    color: colors.text,
    fontWeight: "700"
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: 22
  },
  label: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "700",
    marginBottom: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.secondary
  },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center"
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center"
  },
  finePrint: {
    marginTop: spacing.sm,
    fontSize: typography.small,
    color: colors.mutedText,
    textAlign: "center"
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 }
});
