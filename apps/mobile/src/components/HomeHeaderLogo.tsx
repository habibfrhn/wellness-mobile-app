import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { spacing } from "../theme/tokens";

const logoSource = require("../../assets/header-logo.png");

export default function HomeHeaderLogo() {
  return (
    <View style={styles.container}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: spacing.xl,
    height: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  logo: {
    width: spacing.xl - spacing.xs / 2,
    height: spacing.xl - spacing.xs / 2,
  },
});
