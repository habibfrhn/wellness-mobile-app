import React from "react";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import HomeScreenBase from "./HomeScreenBase";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return <HomeScreenBase navigation={navigation} centered />;
}
