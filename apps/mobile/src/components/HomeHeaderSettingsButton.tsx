import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing, typography } from "../theme/tokens";
import type { AppStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  withWhiteCircle?: boolean;
};

export default function HomeHeaderSettingsButton({ navigation, withWhiteCircle = false }: Props) {
  return (
    <Pressable
      onPress={() => navigation.navigate("Settings")}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        withWhiteCircle && styles.buttonWhiteCircle,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Buka pengaturan"
    >
      <MaterialCommunityIcons name="cog-outline" size={typography.iconMd} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: spacing.xl / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonWhiteCircle: {
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.75,
  },
});
