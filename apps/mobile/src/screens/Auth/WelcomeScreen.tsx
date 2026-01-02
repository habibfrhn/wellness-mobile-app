import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={{ gap: spacing.sm }}>
        <Text style={styles.title}>Wellness</Text>
        <Text style={styles.subtitle}>
          Verify once. Then you can play tonight.
        </Text>
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed
          ]}
        >
          <Text style={styles.primaryButtonText}>Sign up to start tonight</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed
          ]}
        >
          <Text style={styles.secondaryButtonText}>Log in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    justifyContent: "center"
  },
  title: {
    fontSize: typography.h1,
    color: colors.text,
    fontWeight: "700"
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: 22
  },
  primaryButton: {
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
  pressed: {
    opacity: 0.85
  }
});
