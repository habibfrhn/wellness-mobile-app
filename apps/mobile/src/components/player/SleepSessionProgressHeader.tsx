import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme/tokens";

type SleepSessionProgressHeaderProps = {
  title: string;
  subtitle: string;
  compact?: boolean;
};

export default function SleepSessionProgressHeader({
  title,
  subtitle,
  compact = false,
}: SleepSessionProgressHeaderProps) {
  return (
    <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
      <View style={styles.titleTextWrap}>
        <Text style={[styles.title, compact && styles.titleCompact]}>
          {title}
        </Text>
        <Text style={[styles.creator, compact && styles.creatorCompact]}>
          {subtitle}
        </Text>
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
  titleRowCompact: {
    marginTop: spacing.md,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: { fontSize: typography.title, color: colors.text, fontWeight: "700" },
  titleCompact: { fontSize: typography.h2 },
  creator: {
    marginTop: spacing.xs / 4,
    fontSize: typography.caption,
    color: colors.mutedText,
  },
  creatorCompact: { fontSize: typography.small },
});
