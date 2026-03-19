import React, { useLayoutEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SettingsContent from "../../components/SettingsContent";
import HeaderCloseButton from "../../components/navigation/HeaderCloseButton";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerBackVisible: false,
      headerLeft: () => <HeaderCloseButton onPress={() => navigation.goBack()} />,
    });
  }, [navigation]);

  return (
    <WebResponsiveFrame contentStyle={{ maxWidth: 820 }}>
      <SettingsContent navigation={navigation} />
    </WebResponsiveFrame>
  );
}
