import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  onPress: () => void;
};

export default function HomeFoundingMemberCard({ onPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{id.home.foundingMemberTitle}</Text>
      <Text style={styles.body}>{id.home.foundingMemberBody}</Text>
      <Pressable onPress={onPress} style={styles.cta}>
        <Text style={styles.ctaText}>{id.home.foundingMemberCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}1A`,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: typography.small,
    lineHeight: 20,
    color: colors.text,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignSelf: "stretch",
    minHeight: 56,
    width: "100%",
    maxWidth: 280,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});
