import React from "react";
import { StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  message: string | null;
};

export default function AdminStatusMessage({ message }: Props) {
  if (!message) {
    return null;
  }

  return <Text style={styles.errorText}>{message}</Text>;
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
});
