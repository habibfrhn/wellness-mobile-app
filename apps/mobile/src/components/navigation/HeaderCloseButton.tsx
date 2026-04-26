import React from "react";

import { id } from "../../i18n/strings";
import HeaderIconButton from "./HeaderIconButton";

type Props = {
  onPress: () => void;
};

export default function HeaderCloseButton({ onPress }: Props) {
  return <HeaderIconButton icon="✕" accessibilityLabel={id.login.closeLabel} onPress={onPress} />;
}
