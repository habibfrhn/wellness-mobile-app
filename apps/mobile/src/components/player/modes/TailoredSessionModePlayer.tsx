import React, { useState } from "react";
import { View } from "react-native";

import SleepSessionProgressHeader from "../SleepSessionProgressHeader";
import SleepSessionProgressSection from "../SleepSessionProgressSection";
import TailoredSessionControls from "../TailoredSessionControls";

type Props = {
  title: string;
  subtitle: string;
  isPlaying: boolean;
  sessionCurrent: number;
  sessionDuration: number;
  sessionProgressRatio: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  compact?: boolean;
};

export default function TailoredSessionModePlayer({
  title,
  subtitle,
  isPlaying,
  sessionCurrent,
  sessionDuration,
  sessionProgressRatio,
  onTogglePlay,
  onRestart,
  compact = false,
}: Props) {
  const [progressWidth, setProgressWidth] = useState(0);

  return (
    <View>
      <SleepSessionProgressHeader title={title} subtitle={subtitle} compact={compact} />
      <SleepSessionProgressSection
        sessionCurrent={sessionCurrent}
        sessionDuration={sessionDuration}
        sessionProgressRatio={sessionProgressRatio}
        onLayoutWidth={setProgressWidth}
        progressWidth={progressWidth}
        compact={compact}
      />
      <TailoredSessionControls isPlaying={isPlaying} onRestart={onRestart} onTogglePlay={onTogglePlay} compact={compact} />
    </View>
  );
}
