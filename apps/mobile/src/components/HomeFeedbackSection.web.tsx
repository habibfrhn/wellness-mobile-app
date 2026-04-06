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
    backgroundColor: `${colors.card}CC`,
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
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.mutedText,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    width: "100%",
  },
  ctaButtonHover: { backgroundColor: colors.secondaryHover, borderColor: colors.secondaryHover },
  ctaButtonPressed: { backgroundColor: colors.secondaryPressed, borderColor: colors.secondaryPressed },
  ctaText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
