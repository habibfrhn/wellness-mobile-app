import React, { useLayoutEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SettingsContent from "../../components/SettingsContent";
import HeaderCloseButton from "../../components/navigation/HeaderCloseButton";
import type { AppStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerBackVisible: false,
      headerLeft: () => <HeaderCloseButton onPress={() => navigation.goBack()} />,
      headerStyle: { backgroundColor: colors.bg },
    });
  }, [navigation]);

  return <SettingsContent navigation={navigation} />;
}
