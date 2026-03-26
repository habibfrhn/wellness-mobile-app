import { useCallback, useMemo } from "react";

import type { AudioTrack } from "../../content/audioCatalog";
import type { BrowserAudioEngine } from "./useBrowserAudioEngine";
import { getAudioAssetUri } from "./audioAssetUri";

export function useNormalAudioModeController({ engine, track }: { engine: BrowserAudioEngine; track: AudioTrack }) {
  const source = useMemo(() => getAudioAssetUri(track.asset), [track.asset]);
  const isPlaying = engine.state.phase === "playing";
  const duration = engine.state.duration || track.durationSec;
  const current = Math.min(engine.state.currentTime, duration);
  const progressRatio = duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;

  const start = useCallback(async () => {
    await engine.start({ source, seekTo: 0, loop: false });
  }, [engine, source]);

  const togglePlay = useCallback(async () => {
    if (engine.state.phase === "playing") {
      engine.pause();
      return;
    }

    if (engine.state.phase === "completed" || engine.state.phase === "idle") {
      await start();
      return;
    }

    await engine.resume();
  }, [engine, start]);

  const restart = useCallback(async () => {
    await start();
  }, [start]);

  const seek = useCallback(
    (seconds: number) => {
      engine.seek(seconds);
    },
    [engine],
  );

  return {
    phase: engine.state.phase,
    error: engine.state.error,
    isPlaying,
    current,
    duration,
    progressRatio,
    togglePlay,
    restart,
    seek,
  };
}
