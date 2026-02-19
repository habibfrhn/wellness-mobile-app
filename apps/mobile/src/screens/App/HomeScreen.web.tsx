import React from "react";
import { StyleSheet } from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import HomeScreenBase from "./HomeScreenBase";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation, route }: Props) {
  return (
    <WebResponsiveFrame contentStyle={styles.frameContent}>
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
