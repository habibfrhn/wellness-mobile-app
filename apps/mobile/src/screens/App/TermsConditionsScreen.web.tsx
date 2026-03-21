import React, { useLayoutEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import TermsConditionsContent from "../../components/terms/TermsConditionsContent";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";
import type { AppStackParamList } from "../../navigation/types";
import { colors } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "TermsConditions">;

export default function TermsConditionsScreen({ navigation }: Props) {
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: colors.bg },
    });
  }, [navigation]);

  return (
    <WebResponsiveFrame disableFrame>
      <TermsConditionsContent />
    </WebResponsiveFrame>
  );
}
