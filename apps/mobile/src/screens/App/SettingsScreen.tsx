import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SettingsContent from "../../components/SettingsContent";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  return <SettingsContent navigation={navigation} />;
}
