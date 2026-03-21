import React, { useLayoutEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PrivacyPolicyContent from "../../components/privacy/PrivacyPolicyContent";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";
import type { AppStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "PrivacyPolicy">;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: colors.bg },
    });
  }, [navigation]);

  return (
    <WebResponsiveFrame disableFrame>
      <PrivacyPolicyContent />
    </WebResponsiveFrame>
  );
}
