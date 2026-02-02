import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, TextInput } from "react-native";

import { colors, spacing, radius, typography } from "../theme/tokens";
import { id } from "../i18n/strings";

type Props = {
  email: string;
  name: string;
  onNameChange: (value: string) => void;
  onSaveName: () => void;
  isSaveDisabled: boolean;
  isNameTooLong: boolean;
  onLogout: () => void;
};

export default function ProfileContent({
  email,
  name,
  onNameChange,
  onSaveName,
  isSaveDisabled,
  isNameTooLong,
  onLogout,
}: Props) {
  const saveLabel = isNameTooLong ? id.account.nameMaxLength : id.account.saveName;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.sectionTitle}>{id.account.nameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder={id.account.namePlaceholder}
          placeholderTextColor={colors.mutedText}
          style={styles.textInput}
          autoCapitalize="words"
        />
        <Pressable
          onPress={onSaveName}
          disabled={isSaveDisabled}
          style={({ pressed }) => [
            styles.primaryButton,
            isSaveDisabled && styles.primaryButtonDisabled,
            pressed && !isSaveDisabled && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>{saveLabel}</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.sectionTitle}>{id.account.emailLabel}</Text>
        <Text style={styles.email}>{email || "-"}</Text>
      </View>

      <Pressable onPress={onLogout} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Text style={styles.secondaryButtonText}>{id.account.logout}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    backgroundColor: colors.bg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  sectionTitle: { fontSize: typography.small, color: colors.mutedText, fontWeight: "700" },
  textInput: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    fontSize: typography.body,
    color: colors.text,
  },
  email: { fontSize: typography.body, color: colors.text, fontWeight: "700" },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.mutedText,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },

  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },

  pressed: { opacity: 0.85 },
});
