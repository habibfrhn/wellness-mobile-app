import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";
import { sharedCardShadowStyle } from "../theme/shadows";

const FEEDBACK_FORM_URL = "https://form.jotform.com/260907495594067";

export default function HomeFeedbackSection() {
  const handlePress = () => {
    void Linking.openURL(FEEDBACK_FORM_URL);
  };

  return (
    <View style={[styles.container, styles.cardShadow]}>
      <Text style={styles.title}>{id.home.feedbackTitle}</Text>
      <Text style={styles.description}>{id.home.feedbackDescription}</Text>
      <Pressable onPress={handlePress} style={styles.ctaButton}>
        <Text style={styles.ctaText}>{id.home.feedbackCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.card}CC`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.mutedText}33`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  cardShadow: sharedCardShadowStyle,
  title: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: typography.small,
    textAlign: "center",
    maxWidth: 560,
  },
  ctaButton: {
    minHeight: 52,
    minWidth: 152,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  ctaText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "600",
  },
});
