import React from "react";
import { StyleSheet } from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import HomeScreenBase from "./HomeScreenBase";
import WebFrame from "../../components/WebFrame";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation, route }: Props) {
  return (
    <WebFrame contentStyle={styles.frameContent}>
      <HomeScreenBase navigation={navigation} routeParams={route.params} centered />
    </WebFrame>
  );
}

const styles = StyleSheet.create({
  frameContent: {
    flex: 1,
    maxHeight: "100%",
  },
});
