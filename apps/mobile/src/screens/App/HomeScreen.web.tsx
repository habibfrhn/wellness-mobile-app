import React from "react";
import { StyleSheet } from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import HomeScreenBase from "./HomeScreenBase";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";
import useViewportWidth from "../../hooks/useViewportWidth";
import { getWebDesktopTypeScale } from "../../theme/webDesktopTypeScale";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation, route }: Props) {
  const width = useViewportWidth();
  const desktopScale = getWebDesktopTypeScale(width);

  return (
    <WebResponsiveFrame
      contentStyle={[styles.frameContent, desktopScale.isDesktopWeb && { padding: desktopScale.sectionPadding }]}
    >
      <HomeScreenBase navigation={navigation} routeParams={route.params} centered />
    </WebResponsiveFrame>
  );
}

const styles = StyleSheet.create({
  frameContent: {
    flex: 1,
    maxHeight: "100%",
  },
});
