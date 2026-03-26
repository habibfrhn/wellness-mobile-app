import React, { useCallback, useState } from "react";
import { View } from "react-native";

import NormalAudioControls from "../NormalAudioControls";
import PlayerProgressSection from "../PlayerProgressSection";
import SleepSessionProgressHeader from "../SleepSessionProgressHeader";
import type { AudioTrack } from "../../../content/audioCatalog";

type Props = {
  track: AudioTrack;
  current: number;
  duration: number;
  progressRatio: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  compact?: boolean;
};

export default function NormalAudioModePlayer({
  track,
  current,
  duration,
  progressRatio,
  isPlaying,
  onSeek,
  onTogglePlay,
  onRestart,
  compact = false,
}: Props) {
  const [progressWidth, setProgressWidth] = useState(0);

  const onSeekBarPress = useCallback(
    (locationX: number) => {
      if (!duration || !progressWidth) return;
      const ratio = Math.min(Math.max(locationX / progressWidth, 0), 1);
      onSeek(ratio * duration);
    },
    [duration, onSeek, progressWidth],
  );

  return (
    <View>
      <SleepSessionProgressHeader title={track.title} subtitle={track.creator} compact={compact} />
      <PlayerProgressSection
        current={current}
        duration={duration}
        progressRatio={progressRatio}
        onLayoutWidth={setProgressWidth}
        onSeek={onSeekBarPress}
        progressWidth={progressWidth}
        compact={compact}
      />
      <NormalAudioControls isPlaying={isPlaying} onRestart={onRestart} onTogglePlay={onTogglePlay} compact={compact} />
    </View>
  );
}
