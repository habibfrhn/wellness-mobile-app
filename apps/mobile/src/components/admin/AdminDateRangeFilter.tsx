import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AdminAnalyticsRange } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

const OPTIONS: AdminAnalyticsRange[] = ["7d", "30d", "90d", "all"];

type Props = {
  value: AdminAnalyticsRange;
  onChange: (next: AdminAnalyticsRange) => void;
};

export default function AdminDateRangeFilter({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option === value;
        const label = id.admin.rangeLabels[option];
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.mutedText,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.card,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.primaryText,
  },
});
