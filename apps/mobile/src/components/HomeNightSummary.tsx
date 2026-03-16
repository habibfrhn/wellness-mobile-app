import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  onPressPrimary: () => void;
};

export default function HomeNightSummary({ onPressPrimary }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.primaryCardTitle}</Text>
      <Text style={styles.body}>{id.home.primaryCardBody}</Text>

      <Pressable onPress={onPressPrimary} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: typography.body,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
});
