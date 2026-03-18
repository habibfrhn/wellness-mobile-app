import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme/tokens";

type SleepSessionProgressHeaderProps = {
  title: string;
  subtitle: string;
};

export default function SleepSessionProgressHeader({ title, subtitle }: SleepSessionProgressHeaderProps) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleTextWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.creator}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: { fontSize: typography.title, color: colors.text, fontWeight: "700" },
  creator: { marginTop: spacing.xs / 4, fontSize: typography.caption, color: colors.mutedText },
});
