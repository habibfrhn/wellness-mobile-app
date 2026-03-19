import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function SettingsSection({ title, children }: Props) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.small,
    fontWeight: "700",
    color: colors.mutedText,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
