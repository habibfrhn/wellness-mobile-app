import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  label: string;
  onPress?: () => void;
  value?: string;
  valueColor?: string;
  destructive?: boolean;
  showChevron?: boolean;
  showDivider?: boolean;
  rightNode?: React.ReactNode;
};

export default function SettingsRow({
  label,
  onPress,
  value,
  valueColor,
  destructive = false,
  showChevron = false,
  showDivider = true,
  rightNode,
}: Props) {
  const content = (
    <>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightNode}
        {value ? <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text> : null}
        {showChevron ? <Text style={styles.chevron}>›</Text> : null}
      </View>
      {showDivider ? <View style={styles.rowDivider} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    gap: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  rowLabelDanger: {
    color: colors.danger,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
    flexShrink: 1,
    flexBasis: "58%",
    maxWidth: "62%",
  },
  rowValue: {
    fontSize: typography.small,
    color: colors.mutedText,
    textAlign: "right",
  },
  rowDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: `${colors.mutedText}22`,
  },
  chevron: {
    fontSize: typography.title,
    color: colors.mutedText,
    lineHeight: typography.title,
  },
  pressedRow: {
    opacity: 0.82,
  },
});
