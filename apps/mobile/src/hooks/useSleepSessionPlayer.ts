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
  pauseAll: () => void;
  resetPlayers: () => void;
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
  pauseAll,
  resetPlayers,
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
        resetPlayers();
        primaryPlayer.seekTo(0);
        primaryPlayer.play();
        setHasSessionStarted(true);
        return;
      }

      if (atEnd) {
        activePlayer.seekTo(0);
      }
      activePlayer.play();
      setHasSessionStarted(true);
    } catch {
      // no-op
    }
  }, [activePlayer, activeStatusPlaying, atEnd, hasSessionStarted, pauseAll, primaryPlayer, resetPlayers, setHasSessionStarted]);

  const onRestart = useCallback(() => {
    try {
      resetPlayers();
      primaryPlayer.play();
      setHasSessionStarted(true);
    } catch {
      // no-op
    }
  }, [primaryPlayer, resetPlayers, setHasSessionStarted]);

  useEffect(() => {
    if (!isTailoredSession || !autoPlayNextTrack) {
      return;
    }

    try {
      primaryPlayer.play();
      setHasSessionStarted(true);
    } catch {
      // no-op
    } finally {
      setAutoPlayNextTrack(false);
    }
  }, [autoPlayNextTrack, isTailoredSession, primaryPlayer, setAutoPlayNextTrack, setHasSessionStarted]);

  useEffect(() => {
    if (!isTailoredSession || !hasSessionStarted || activeStatusPlaying || !atEnd) {
      return;
    }

    if (playlistIndex < trackDurations.length - 1) {
      setPlaylistIndex((prev) => prev + 1);
      setAutoPlayNextTrack(true);
      return;
    }

    resetPlayers();
    setHasSessionStarted(false);
    setPlaylistIndex(0);
  }, [
    activeStatusPlaying,
    atEnd,
    hasSessionStarted,
    isTailoredSession,
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
