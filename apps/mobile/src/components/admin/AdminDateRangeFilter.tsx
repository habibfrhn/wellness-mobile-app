import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AdminAnalyticsRange } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

const OPTIONS: AdminAnalyticsRange[] = ["today", "7d", "1m", "3m", "6m", "1y"];

type Props = {
  value: AdminAnalyticsRange;
  onChange: (next: AdminAnalyticsRange) => void;
  disabled?: boolean;
};

export default function AdminDateRangeFilter({ value, onChange, disabled = false }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const active = option === value;
        const label = id.admin.rangeLabels[option];
        return (
          <Pressable
            key={option}
            disabled={disabled}
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
