import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getWebViewport } from "../constants/webLayout";
import { id } from "../i18n/strings";
import useViewportWidth from "../hooks/useViewportWidth";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  onPress: () => void;
};

export default function HomeFoundingMemberCard({ onPress }: Props) {
  const viewport = getWebViewport(useViewportWidth());
  const isMobileWeb = viewport === "mobile";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{id.home.foundingMemberTitle}</Text>
      <Text style={styles.body}>{id.home.foundingMemberBody}</Text>
      <Pressable onPress={onPress} style={[styles.cta, isMobileWeb ? styles.ctaMobile : styles.ctaDesktopTablet]}>
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
    marginTop: spacing.md,
    backgroundColor: "#E6E8ED",
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    borderRadius: radius.sm,
    minHeight: 52,
    minWidth: 152,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaMobile: {
    alignSelf: "center",
  },
  ctaDesktopTablet: {
    alignSelf: "flex-start",
  },
  ctaText: {
    color: colors.primary,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});
