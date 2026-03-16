import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, spacing, typography } from "../theme/tokens";

export default function HomeGreetingTitle() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.greetingNoName}</Text>
      <Text style={styles.subtitle}>{id.home.greetingSubtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs / 2,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
});
