import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getWebViewport } from "../constants/webLayout";
import { id } from "../i18n/strings";
import useViewportWidth from "../hooks/useViewportWidth";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  onPressPrimary: () => void;
};

export default function HomeNightSummary({ onPressPrimary }: Props) {
  const viewport = getWebViewport(useViewportWidth());
  const isDesktop = viewport === "desktop";

  return (
    <View style={[styles.container, isDesktop ? styles.containerDesktop : styles.containerCompact]}>
      <Text style={styles.title}>{id.home.primaryCardTitle}</Text>
      <Text style={styles.body}>{id.home.primaryCardBody}</Text>

      <Pressable onPress={onPressPrimary} style={[styles.primaryButton, isDesktop ? styles.primaryButtonDesktop : styles.primaryButtonCompact]}>
        <Text style={styles.primaryButtonText}>{id.home.primarySleepCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  containerCompact: {
    padding: spacing.lg,
  },
  containerDesktop: {
    padding: spacing.xl,
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
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignSelf: "stretch",
    minHeight: 56,
    width: "100%",
    maxWidth: 280,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonCompact: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonDesktop: {
    marginTop: spacing.lg,
    width: 280,
    alignSelf: "center",
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});
