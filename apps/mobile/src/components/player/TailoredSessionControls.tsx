import React from "react";

import NormalAudioControls from "./NormalAudioControls";

type TailoredSessionControlsProps = {
  isPlaying: boolean;
  onRestart: () => void;
  onTogglePlay: () => void;
};

export default function TailoredSessionControls(props: TailoredSessionControlsProps) {
  return <NormalAudioControls {...props} />;
}
