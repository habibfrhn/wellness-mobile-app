import { useCallback, useEffect, useMemo, useReducer } from "react";

import type { AudioTrack } from "../../content/audioCatalog";
import type { BrowserAudioEngine } from "./useBrowserAudioEngine";
import { getAudioAssetUri } from "./audioAssetUri";

export const TIMER_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 h", seconds: 60 * 60 },
];

type SoundscapeState = {
  timerSeconds: number;
  timerRemaining: number;
};

type SoundscapeAction =
  | { type: "SELECT_TIMER"; seconds: number }
  | { type: "TICK" }
  | { type: "RESET" };

function reducer(state: SoundscapeState, action: SoundscapeAction): SoundscapeState {
  switch (action.type) {
    case "SELECT_TIMER":
      return { timerSeconds: action.seconds, timerRemaining: action.seconds };
    case "TICK":
      return { ...state, timerRemaining: Math.max(state.timerRemaining - 1, 0) };
    case "RESET":
      return { ...state, timerRemaining: state.timerSeconds };
    default:
      return state;
  }
}

export function useSoundscapeModeController({ engine, track }: { engine: BrowserAudioEngine; track: AudioTrack }) {
  const source = useMemo(() => getAudioAssetUri(track.asset), [track.asset]);
  const sourceError = source ? null : "Audio source tidak tersedia.";
  const [state, dispatch] = useReducer(reducer, {
    timerSeconds: TIMER_OPTIONS[0].seconds,
    timerRemaining: TIMER_OPTIONS[0].seconds,
  });

  const isPlaying = engine.state.phase === "playing";
  const current = engine.state.currentTime;
  const duration = engine.state.duration || track.durationSec;
  const progressRatio = duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;

  const start = useCallback(async () => {
    if (!source) {
      return;
    }
    engine.setLoop(true);
    const started = await engine.start({ source, seekTo: 0, loop: true });
    if (!started) return;
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

  const stop = useCallback(() => {
    engine.stop();
    dispatch({ type: "RESET" });
  }, [engine]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (state.timerRemaining > 0) {
      return;
    }

    stop();
  }, [state.timerRemaining, stop]);

  return {
    phase: engine.state.phase,
    error: engine.state.error ?? sourceError,
    isPlaying,
    current,
    duration,
    progressRatio,
    timerSeconds: state.timerSeconds,
    timerRemaining: state.timerRemaining,
    isSessionActive: isPlaying || (engine.state.phase === "paused" && current > 0),
    selectTimer: (seconds: number) => dispatch({ type: "SELECT_TIMER", seconds }),
    togglePlay,
    stop,
    restart: start,
  };
}
