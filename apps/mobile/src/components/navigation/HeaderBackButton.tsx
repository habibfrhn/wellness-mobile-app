import React from "react";

import HeaderIconButton from "./HeaderIconButton";

type Props = {
  onPress: () => void;
};

export default function HeaderBackButton({ onPress }: Props) {
  return <HeaderIconButton icon="←" accessibilityLabel="Kembali" onPress={onPress} />;
}
