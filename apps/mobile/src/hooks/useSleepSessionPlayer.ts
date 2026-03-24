import { useCallback, useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseSleepSessionPlayerArgs = {
  isTailoredSession: boolean;
  trackDurations: number[];
  playlistIndex: number;
  setPlaylistIndex: Dispatch<SetStateAction<number>>;
  current: number;
  activeStatusPlaying: boolean;
  atEnd: boolean;
  hasSessionStarted: boolean;
  setHasSessionStarted: Dispatch<SetStateAction<boolean>>;
  autoPlayNextTrack: boolean;
  setAutoPlayNextTrack: Dispatch<SetStateAction<boolean>>;
  activePlayer: any;
  primaryPlayer: any;
  playWithRetry: (player: any) => void;
  pauseAll: () => void;
  resetPlayers: () => void;
  onSessionComplete?: () => void;
};

export function useSleepSessionPlayer({
  isTailoredSession,
  trackDurations,
  playlistIndex,
  setPlaylistIndex,
  current,
  activeStatusPlaying,
  atEnd,
  hasSessionStarted,
  setHasSessionStarted,
  autoPlayNextTrack,
  setAutoPlayNextTrack,
  activePlayer,
  primaryPlayer,
  playWithRetry,
  pauseAll,
  resetPlayers,
  onSessionComplete,
}: UseSleepSessionPlayerArgs) {
  const elapsedBeforeCurrent = useMemo(
    () => trackDurations.slice(0, playlistIndex).reduce((sum, item) => sum + item, 0),
    [playlistIndex, trackDurations],
  );
  const sessionDuration = useMemo(() => trackDurations.reduce((sum, item) => sum + item, 0), [trackDurations]);
  const sessionCurrent = useMemo(
    () => Math.min(sessionDuration, elapsedBeforeCurrent + current),
    [current, elapsedBeforeCurrent, sessionDuration],
  );
  const sessionProgressRatio = useMemo(
    () => (sessionDuration > 0 ? Math.min(Math.max(sessionCurrent / sessionDuration, 0), 1) : 0),
    [sessionCurrent, sessionDuration],
  );

  const onTogglePlay = useCallback(() => {
    try {
      if (activeStatusPlaying) {
        pauseAll();
        return;
      }

      if (!hasSessionStarted) {
        pauseAll();
        setAutoPlayNextTrack(false);
        setHasSessionStarted(true);
        primaryPlayer.seekTo(0);
        playWithRetry(primaryPlayer);
        return;
      }

      if (atEnd) {
        activePlayer.seekTo(0);
      }
      playWithRetry(activePlayer);
      setHasSessionStarted(true);
    } catch {
      // no-op
    }
  }, [
    activePlayer,
    activeStatusPlaying,
    atEnd,
    hasSessionStarted,
    pauseAll,
    playWithRetry,
    primaryPlayer,
    setHasSessionStarted,
  ]);

  const onRestart = useCallback(() => {
    try {
      resetPlayers();
      playWithRetry(primaryPlayer);
      setHasSessionStarted(true);
    } catch {
      // no-op
    }
  }, [playWithRetry, primaryPlayer, resetPlayers, setHasSessionStarted]);

  useEffect(() => {
    if (!isTailoredSession || !autoPlayNextTrack) {
      return;
    }

    try {
      playWithRetry(primaryPlayer);
      setHasSessionStarted(true);
    } catch {
      // no-op
    } finally {
      setAutoPlayNextTrack(false);
    }
  }, [
    autoPlayNextTrack,
    isTailoredSession,
    playWithRetry,
    primaryPlayer,
    setAutoPlayNextTrack,
    setHasSessionStarted,
  ]);

  useEffect(() => {
    if (!isTailoredSession || !hasSessionStarted || activeStatusPlaying || !atEnd) {
      return;
    }

    if (playlistIndex < trackDurations.length - 1) {
      setPlaylistIndex((prev) => prev + 1);
      setAutoPlayNextTrack(true);
      return;
    }

    onSessionComplete?.();
    resetPlayers();
    setHasSessionStarted(false);
    setPlaylistIndex(0);
  }, [
    activeStatusPlaying,
    atEnd,
    hasSessionStarted,
    isTailoredSession,
    onSessionComplete,
    playlistIndex,
    resetPlayers,
    setAutoPlayNextTrack,
    setHasSessionStarted,
    setPlaylistIndex,
    trackDurations.length,
  ]);

  return {
    sessionDuration,
    sessionCurrent,
    sessionProgressRatio,
    onTogglePlay,
    onRestart,
  };
}
