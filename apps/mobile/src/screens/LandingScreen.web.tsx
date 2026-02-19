import React from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import WebFrame from "../components/WebFrame";
import { colors, radius, spacing, typography, lineHeights } from "../theme/tokens";

type LandingScreenProps = {
  navigation: NavigationProp<ParamListBase>;
};

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const handlePrimaryPress = () => {
    navigation.navigate("Auth");
  };

  return (
    <WebFrame>
      <View style={styles.container}>
        <Text style={styles.headline}>Ritual malam 15 menit untuk menutup hari dengan tenang.</Text>

        <Text style={styles.subtext}>Tanpa iklan. Tanpa scrolling. Tanpa overstimulation.</Text>

        <Pressable onPress={handlePrimaryPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Coba Gratis (Beta)</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Auth")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>Masuk</Text>
        </Pressable>
      </View>
    </WebFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
  headline: {
    fontSize: typography.h1,
    lineHeight: typography.h1 + spacing.sm,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text,
  },
  subtext: {
    fontSize: typography.body,
    lineHeight: lineHeights.relaxed,
    textAlign: "center",
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.text,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    backgroundColor: colors.secondary,
  },
  secondaryButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.secondaryText,
  },
  pressed: {
    opacity: 0.85,
  },
});
