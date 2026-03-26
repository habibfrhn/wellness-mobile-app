import { useCallback, useEffect, useMemo, useReducer } from "react";

import { getTrackById, type AudioId } from "../../content/audioCatalog";
import { saveNightSessionCompletion, type NightSessionMode } from "../../services/nightSessions";
import type { BrowserAudioEngine } from "./useBrowserAudioEngine";
import { getAudioAssetUri } from "./audioAssetUri";

type SessionPhase = "idle" | "preparing" | "ready" | "playing" | "paused" | "error" | "completed";

type SessionState = {
  phase: SessionPhase;
  playlistIndex: number;
  hasStarted: boolean;
};

type SessionAction =
  | { type: "START_REQUEST" }
  | { type: "PLAYING" }
  | { type: "PAUSED" }
  | { type: "NEXT_TRACK" }
  | { type: "ERROR" }
  | { type: "RESET" }
  | { type: "COMPLETED" };

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START_REQUEST":
      return { ...state, phase: "preparing", hasStarted: true };
    case "PLAYING":
      return { ...state, phase: "playing", hasStarted: true };
    case "PAUSED":
      return { ...state, phase: "paused" };
    case "NEXT_TRACK":
      return { ...state, playlistIndex: state.playlistIndex + 1, phase: "preparing", hasStarted: true };
    case "ERROR":
      return { ...state, phase: "error" };
    case "COMPLETED":
      return { ...state, phase: "completed" };
    case "RESET":
      return { phase: "idle", playlistIndex: 0, hasStarted: false };
    default:
      return state;
  }
}

export function useTailoredSessionModeController({
  engine,
  playlistIds,
  initialAudioId,
  sleepMode,
}: {
  engine: BrowserAudioEngine;
  playlistIds: AudioId[];
  initialAudioId: AudioId;
  sleepMode?: NightSessionMode;
}) {
  const normalizedPlaylistIds = useMemo(() => {
    const sourceIds = playlistIds.length ? playlistIds : [initialAudioId];
    return sourceIds.filter((value, index, arr) => arr.indexOf(value) === index);
  }, [initialAudioId, playlistIds]);

  const startIndex = Math.max(normalizedPlaylistIds.indexOf(initialAudioId), 0);
  const [state, dispatch] = useReducer(reducer, {
    phase: "idle",
    playlistIndex: startIndex,
    hasStarted: false,
  });

  const tracks = useMemo(() => normalizedPlaylistIds.map((id) => getTrackById(id)), [normalizedPlaylistIds]);
  const currentTrack = tracks[state.playlistIndex] ?? tracks[0];
  const source = useMemo(() => getAudioAssetUri(currentTrack.asset), [currentTrack.asset]);
  const sourceError = source ? null : "Audio source tidak tersedia.";
  const trackDurations = useMemo(() => tracks.map((track) => track.durationSec), [tracks]);
  const elapsedBeforeCurrent = useMemo(
    () => trackDurations.slice(0, state.playlistIndex).reduce((sum, item) => sum + item, 0),
    [state.playlistIndex, trackDurations],
  );
  const sessionDuration = useMemo(() => trackDurations.reduce((sum, item) => sum + item, 0), [trackDurations]);
  const sessionCurrent = Math.min(sessionDuration, elapsedBeforeCurrent + engine.state.currentTime);
  const sessionProgressRatio = sessionDuration > 0 ? Math.min(Math.max(sessionCurrent / sessionDuration, 0), 1) : 0;

  const startCurrentTrack = useCallback(async () => {
    dispatch({ type: "START_REQUEST" });
    if (!source) {
      dispatch({ type: "ERROR" });
      return false;
    }
    const started = await engine.start({ source, seekTo: 0, loop: false });
    if (!started) {
      dispatch({ type: "ERROR" });
      return false;
    }
    dispatch({ type: "PLAYING" });
    return true;
  }, [engine, source]);

  const restart = useCallback(async () => {
    engine.stop();
    dispatch({ type: "RESET" });
    const restartSource = getAudioAssetUri(tracks[0].asset);
    if (!restartSource) {
      dispatch({ type: "ERROR" });
      return;
    }
    const started = await engine.start({ source: restartSource, seekTo: 0, loop: false });
    if (!started) {
      dispatch({ type: "ERROR" });
      return;
    }
    dispatch({ type: "PLAYING" });
  }, [engine, tracks]);

  const togglePlay = useCallback(async () => {
    if (engine.state.phase === "playing") {
      engine.pause();
      dispatch({ type: "PAUSED" });
      return;
    }

    if (!state.hasStarted || engine.state.phase === "completed") {
      await startCurrentTrack();
      return;
    }

    const resumed = await engine.resume();
    if (resumed) {
      dispatch({ type: "PLAYING" });
    }
  }, [engine, startCurrentTrack, state.hasStarted]);

  useEffect(() => {
    if (!state.hasStarted || engine.state.phase !== "completed") {
      return;
    }

    const hasNextTrack = state.playlistIndex < tracks.length - 1;
    if (!hasNextTrack) {
      dispatch({ type: "COMPLETED" });
      if (sleepMode) {
        void saveNightSessionCompletion({ mode: sleepMode, stressBefore: 3, stressAfter: 3 });
      }
      return;
    }

    const runAdvance = async () => {
      dispatch({ type: "NEXT_TRACK" });
      const nextTrack = tracks[state.playlistIndex + 1];
      const nextSource = getAudioAssetUri(nextTrack.asset);
      if (!nextSource) {
        dispatch({ type: "ERROR" });
        return;
      }
      const started = await engine.start({ source: nextSource, seekTo: 0, loop: false });
      if (!started) {
        dispatch({ type: "ERROR" });
        return;
      }
      dispatch({ type: "PLAYING" });
    };

    void runAdvance();
  }, [engine, sleepMode, state.hasStarted, state.playlistIndex, tracks]);

  const resetSession = useCallback(() => {
    engine.stop();
    dispatch({ type: "RESET" });
  }, [engine]);

  return {
    phase: state.phase,
    error: engine.state.error ?? sourceError,
    isPlaying: engine.state.phase === "playing",
    currentTrack,
    hasSessionStarted: state.hasStarted,
    playlistIndex: state.playlistIndex,
    sessionDuration,
    sessionCurrent,
    sessionProgressRatio,
    togglePlay,
    restart,
    resetSession,
  };
}
