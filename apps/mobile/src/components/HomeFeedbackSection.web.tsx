import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { getWebViewport } from "../constants/webLayout";
import useViewportWidth from "../hooks/useViewportWidth";
import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

const FEEDBACK_FORM_URL = "https://form.jotform.com/260907495594067";

export default function HomeFeedbackSection() {
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = getWebViewport(viewportWidth) === "desktop";

  const handlePress = () => {
    void Linking.openURL(FEEDBACK_FORM_URL);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.feedbackTitle}</Text>
      <Text style={styles.description}>{id.home.feedbackDescription}</Text>
      <Pressable
        onPress={handlePress}
        style={({ hovered, pressed }: any) => [
          styles.ctaButton,
          hovered && isDesktopWeb && styles.ctaButtonHover,
          pressed && styles.ctaButtonPressed,
        ]}
      >
        <Text style={styles.ctaText}>{id.home.feedbackCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.mutedText}33`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
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
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    alignSelf: "center",
  },
  ctaButtonHover: { backgroundColor: colors.primaryHover, borderColor: colors.primaryHover },
  ctaButtonPressed: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryPressed },
  ctaText: {
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});
