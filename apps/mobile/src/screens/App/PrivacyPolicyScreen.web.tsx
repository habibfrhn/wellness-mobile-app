import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PrivacyPolicyContent from "../../components/privacy/PrivacyPolicyContent";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "PrivacyPolicy">;

export default function PrivacyPolicyScreen(_props: Props) {
  return (
    <WebResponsiveFrame contentStyle={{ maxWidth: 980 }}>
      <PrivacyPolicyContent />
    </WebResponsiveFrame>
  );
}
