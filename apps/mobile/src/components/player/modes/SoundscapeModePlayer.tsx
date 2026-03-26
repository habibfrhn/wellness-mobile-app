import React, { useCallback, useState } from "react";
import { View } from "react-native";

import PlayerProgressSection from "../PlayerProgressSection";
import SleepSessionProgressHeader from "../SleepSessionProgressHeader";
import SoundscapeControls from "../SoundscapeControls";
import SoundscapeTimerSection from "../SoundscapeTimerSection";
import type { AudioTrack } from "../../../content/audioCatalog";
import { TIMER_OPTIONS } from "../../../hooks/player-web/useSoundscapeModeController";

type Props = {
  track: AudioTrack;
  isPlaying: boolean;
  current: number;
  duration: number;
  progressRatio: number;
  timerSeconds: number;
  timerRemaining: number;
  isSessionActive: boolean;
  onSelectTimer: (seconds: number) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (seconds: number) => void;
  compact?: boolean;
};

export default function SoundscapeModePlayer({
  track,
  isPlaying,
  current,
  duration,
  progressRatio,
  timerSeconds,
  timerRemaining,
  isSessionActive,
  onSelectTimer,
  onTogglePlay,
  onStop,
  onSeek,
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
      <SoundscapeTimerSection
        timerOptions={TIMER_OPTIONS}
        timerSeconds={timerSeconds}
        timerRemaining={timerRemaining}
        isSessionActive={isSessionActive}
        onSelectTimer={onSelectTimer}
        compact={compact}
      />
      <PlayerProgressSection
        current={current}
        duration={duration}
        progressRatio={progressRatio}
        onLayoutWidth={setProgressWidth}
        onSeek={onSeekBarPress}
        progressWidth={progressWidth}
        compact={compact}
      />
      <SoundscapeControls isPlaying={isPlaying} onStop={onStop} onTogglePlay={onTogglePlay} compact={compact} />
    </View>
  );
}
