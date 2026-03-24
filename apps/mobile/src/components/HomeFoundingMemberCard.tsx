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
    fontSize: typography.title,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  body: {
    fontSize: typography.small,
    lineHeight: 20,
    color: colors.text,
  },
  cta: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.primary}14`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ctaText: {
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "700",
    color: colors.primary,
  },
});
