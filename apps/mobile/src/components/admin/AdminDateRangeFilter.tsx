import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AdminAnalyticsRange } from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

const OPTIONS: AdminAnalyticsRange[] = ["7d", "30d", "90d", "12m", "all"];

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
            style={({ hovered, pressed }: any) => [
              styles.chip,
              active && styles.chipActive,
              active && hovered && styles.chipActiveHover,
              active && pressed && styles.chipActivePressed,
              pressed && styles.chipPressed,
            ]}
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
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    boxShadow: `0px 6px 14px ${colors.text}24`,
  },
  chipActiveHover: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipActivePressed: {
    shadowOpacity: 0,
    elevation: 0,
    boxShadow: "none",
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
