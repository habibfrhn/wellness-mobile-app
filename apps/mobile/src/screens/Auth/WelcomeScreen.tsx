import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={{ gap: spacing.sm }}>
        <Text style={styles.title}>{id.welcome.title}</Text>
        <Text style={styles.subtitle}>{id.welcome.subtitle}</Text>
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>{id.welcome.primaryCta}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>{id.welcome.secondaryCta}</Text>
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
    lineHeight: typography.lineHeights.relaxed
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
  pressed: { opacity: 0.85 }
});
