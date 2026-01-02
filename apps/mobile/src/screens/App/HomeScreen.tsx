import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

export default function HomeScreen() {
  async function onLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert(id.common.errorTitle, error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.title}</Text>
      <Text style={styles.subtitle}>{id.home.subtitle}</Text>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryButtonText}>{id.home.logout}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg, justifyContent: "center", gap: spacing.sm },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700" },
  subtitle: { fontSize: typography.body, color: colors.mutedText, lineHeight: 22 },
  secondaryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border
  },
  secondaryButtonText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.85 }
});
