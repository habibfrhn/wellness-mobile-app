import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, lineHeights, spacing, typography } from "../../theme/tokens";

const LOGIN_LOGO = require("../../../assets/image/contents/logo.png");

export default function LoginBrandPanel() {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image source={LOGIN_LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandTitle}>Lumepo</Text>
      </View>
      <Text style={styles.brandDescription}>{id.login.brandSupport}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandTitle: {
    fontSize: typography.h1,
    color: colors.text,
    fontWeight: "700",
  },
  brandDescription: {
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: lineHeights.relaxed,
    textAlign: "center",
  },
});
