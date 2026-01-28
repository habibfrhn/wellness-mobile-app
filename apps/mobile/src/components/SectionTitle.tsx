import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";

type SectionTitleProps = {
  title: string;
};

export default function SectionTitle({ title }: SectionTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
});
