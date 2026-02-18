import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import ReminderSettingsContent from "../../components/ReminderSettingsContent";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "ReminderSettings">;

export default function ReminderSettingsScreen(_props: Props) {
  return <ReminderSettingsContent />;
}
