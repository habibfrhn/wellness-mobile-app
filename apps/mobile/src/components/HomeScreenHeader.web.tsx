import React from "react";
import { StyleSheet, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getWebViewport } from "../constants/webLayout";
import useViewportWidth from "../hooks/useViewportWidth";
import type { AppStackParamList } from "../navigation/types";
import { spacing } from "../theme/tokens";
import HomeHeaderLogo from "./HomeHeaderLogo";
import HomeHeaderSettingsButton from "./HomeHeaderSettingsButton";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function HomeScreenHeader({ navigation }: Props) {
  const viewport = getWebViewport(useViewportWidth());

  return (
    <View
      style={[
        styles.row,
        viewport === "tablet" && styles.rowTablet,
        viewport === "mobile" && styles.rowMobile,
      ]}
    >
      <HomeHeaderLogo />
      <HomeHeaderSettingsButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  rowTablet: {
    paddingHorizontal: spacing.md,
  },
  rowMobile: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
});
