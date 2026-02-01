import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/tokens";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenGradientBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={[colors.bg, colors.secondary]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
