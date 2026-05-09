import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { AUDIO_USAGE_FINISH_THRESHOLD, useAudioUsageTracking } from "./useAudioUsageTracking";

const FADE_OUT_SECONDS = 5;
const COMPLETION_THRESHOLD = AUDIO_USAGE_FINISH_THRESHOLD;

export const TIMER_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 h", seconds: 60 * 60 },
];

type UseAudioPlayerSessionArgs = {
  audioId: AudioId;
  playlistIds?: AudioId[];
};

export function useAudioPlayerSession({ audioId, playlistIds }: UseAudioPlayerSessionArgs) {
  const normalizedPlaylistIds = useMemo(() => {
    const sourceIds = playlistIds && playlistIds.length > 0 ? playlistIds : [audioId];
    return sourceIds.filter((value, index, arr) => arr.indexOf(value) === index);
  }, [audioId, playlistIds]);

  const [playlistIndex, setPlaylistIndex] = useState(() => {
    const startIndex = normalizedPlaylistIds.indexOf(audioId);
    return startIndex >= 0 ? startIndex : 0;
  });
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [pendingPlaylistAutoplay, setPendingPlaylistAutoplay] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasInitializedTrackRef = useRef(false);

  const currentAudioId: AudioId = normalizedPlaylistIds[playlistIndex] ?? audioId;
  const track = useMemo(() => getTrackById(currentAudioId), [currentAudioId]);
  const isPlaylistSession = normalizedPlaylistIds.length > 1;
  const isSoundscape = track.contentType === "soundscape" && !isPlaylistSession;
  const showSoundscapeControls = isSoundscape;
  const trackDurations = useMemo(
    () => normalizedPlaylistIds.map((id) => getTrackById(id).durationSec),
    [normalizedPlaylistIds],
  );

  const player = useAudioPlayer(track.asset, { updateInterval: 250 });
  const activeStatus = useAudioPlayerStatus(player);
  const duration = activeStatus.duration || track.durationSec;
  const current = Math.min(activeStatus.currentTime || 0, duration);
  const atEnd = duration > 0 && current >= duration - 0.25;
  const isSessionActive = showSoundscapeControls && (activeStatus.playing || (current > 0 && !atEnd));
  const progressRatio = duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;
  const {
    closeAudioUsageSession,
    resetAudioUsageSession,
    trackAudioFinish,
    trackAudioStart,
  } = useAudioUsageTracking({ audioId: currentAudioId, progressRatio });

  const elapsedBeforeCurrent = useMemo(
    () => trackDurations.slice(0, playlistIndex).reduce((sum, item) => sum + item, 0),
    [playlistIndex, trackDurations],
  );
  const sessionDuration = useMemo(
    () => trackDurations.reduce((sum, item) => sum + item, 0),
    [trackDurations],
  );
  const sessionCurrent = useMemo(
    () => Math.min(sessionDuration, elapsedBeforeCurrent + current),
    [current, elapsedBeforeCurrent, sessionDuration],
  );
  const sessionProgressRatio = useMemo(
    () => (sessionDuration > 0 ? Math.min(Math.max(sessionCurrent / sessionDuration, 0), 1) : 0),
    [sessionCurrent, sessionDuration],
  );

  const setPlayerVolume = useCallback((targetPlayer: any, volume: number) => {
    try {
      if (typeof targetPlayer.setVolume === "function") {
        targetPlayer.setVolume(volume);
      } else {
        targetPlayer.volume = volume;
      }
    } catch {
      // no-op
    }
  }, []);

  const clearFadeOutInterval = useCallback(() => {
    if (fadeOutIntervalRef.current) {
      clearInterval(fadeOutIntervalRef.current);
      fadeOutIntervalRef.current = null;
    }
  }, []);

  const clearRetryTimeouts = useCallback(() => {
    if (!retryTimeoutRefs.current.length) {
      return;
    }

    retryTimeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    retryTimeoutRefs.current = [];
  }, []);

  const playWithRetry = useCallback(
    (targetPlayer: any) => {
      clearRetryTimeouts();
      setPlaybackError(null);

      let attempts = 12;
      const attemptPlay = () => {
        if (attempts <= 0) {
          setPlaybackError("play_failed");
          return;
        }

        attempts -= 1;
        try {
          targetPlayer.play();
        } catch {
          // no-op; retry below to handle slow player readiness
        }

        if (targetPlayer?.playing === true) {
          return;
        }

        const timeoutId = setTimeout(attemptPlay, 160);
        retryTimeoutRefs.current.push(timeoutId);
      };

      attemptPlay();
    },
    [clearRetryTimeouts],
  );

  const resetPlayers = useCallback(() => {
    clearFadeOutInterval();
    try {
      player.pause();
      player.seekTo(0);
    } catch {
      // no-op
    }
    setPlayerVolume(player, 1);
    setPlaybackError(null);
  }, [clearFadeOutInterval, player, setPlayerVolume]);

  const pauseAll = useCallback(() => {
    clearRetryTimeouts();
    try {
      player.pause();
    } catch {
      // no-op
    }
  }, [clearRetryTimeouts, player]);

  const startPlaybackFromBeginning = useCallback(() => {
    resetPlayers();
    resetAudioUsageSession();
    try {
      player.seekTo(0);
    } catch {
      // no-op
    }
    playWithRetry(player);
  }, [playWithRetry, player, resetAudioUsageSession, resetPlayers]);

  const onTogglePlay = useCallback(() => {
    try {
      if (isPlaylistSession) {
        if (activeStatus.playing) {
          pauseAll();
          return;
        }

        if (!hasSessionStarted) {
          setHasSessionStarted(true);
          setPendingPlaylistAutoplay(false);
          startPlaybackFromBeginning();
          return;
        }

        if (atEnd) {
          player.seekTo(0);
        }
        playWithRetry(player);
        return;
      }

      if (activeStatus.playing) {
        pauseAll();
        return;
      }

      if (atEnd) {
        player.seekTo(0);
        resetAudioUsageSession();
      }
      trackAudioStart();
      setPlaybackError(null);
      playWithRetry(player);
    } catch {
      setPlaybackError("play_failed");
    }
  }, [
    activeStatus.playing,
    atEnd,
    hasSessionStarted,
    isPlaylistSession,
    pauseAll,
    player,
    playWithRetry,
    resetAudioUsageSession,
    startPlaybackFromBeginning,
    trackAudioStart,
  ]);

  const onRestart = useCallback(() => {
    if (isPlaylistSession) {
      setPlaylistIndex(0);
      setHasSessionStarted(true);
      setPendingPlaylistAutoplay(true);
      return;
    }

    try {
      resetPlayers();
      resetAudioUsageSession();
      trackAudioStart();
      playWithRetry(player);
    } catch {
      // no-op
    }
  }, [isPlaylistSession, playWithRetry, player, resetAudioUsageSession, resetPlayers, trackAudioStart]);

  const onSeek = useCallback(
    (value: number) => {
      try {
        if (isPlaylistSession) {
          return;
        }
        player.seekTo(value);
      } catch {
        // no-op
      }
    },
    [isPlaylistSession, player],
  );

  const handleTimerSelect = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
    setPlaybackError(null);
  }, []);

  const handleStop = useCallback(() => {
    closeAudioUsageSession();
    resetAudioUsageSession();
    resetPlayers();
    setTimerRemaining(timerSeconds);
  }, [resetAudioUsageSession, resetPlayers, timerSeconds, closeAudioUsageSession]);

  const resetSessionState = useCallback(() => {
    closeAudioUsageSession();
    pauseAll();
    resetPlayers();
    resetAudioUsageSession();
    setPendingPlaylistAutoplay(false);
    setHasSessionStarted(false);
    setPlaylistIndex(0);
    setTimerRemaining(timerSeconds);
  }, [pauseAll, resetAudioUsageSession, resetPlayers, timerSeconds, closeAudioUsageSession]);

  useEffect(() => {
    if (showSoundscapeControls) {
      setTimerSeconds(TIMER_OPTIONS[0].seconds);
      setTimerRemaining(TIMER_OPTIONS[0].seconds);
    } else {
      setTimerSeconds(null);
      setTimerRemaining(null);
    }

    if (!hasInitializedTrackRef.current) {
      hasInitializedTrackRef.current = true;
      return;
    }

    closeAudioUsageSession();
    resetAudioUsageSession();
    resetPlayers();
  }, [resetAudioUsageSession, resetPlayers, showSoundscapeControls, track.id, closeAudioUsageSession]);

  useEffect(() => {
    if (!isPlaylistSession || !pendingPlaylistAutoplay) {
      return;
    }

    setPendingPlaylistAutoplay(false);
    setHasSessionStarted(true);
    startPlaybackFromBeginning();
  }, [isPlaylistSession, pendingPlaylistAutoplay, startPlaybackFromBeginning]);

  useEffect(() => {
    if (!isPlaylistSession || !hasSessionStarted || activeStatus.playing || !atEnd) {
      return;
    }

    if (playlistIndex < trackDurations.length - 1) {
      trackAudioFinish();
      resetAudioUsageSession();
      setPlaylistIndex((prev) => prev + 1);
      setPendingPlaylistAutoplay(true);
      return;
    }

    trackAudioFinish();
    resetPlayers();
    setHasSessionStarted(false);
    setPlaylistIndex(0);
  }, [
    activeStatus.playing,
    atEnd,
    hasSessionStarted,
    isPlaylistSession,
    playlistIndex,
    resetAudioUsageSession,
    resetPlayers,
    trackAudioFinish,
    trackDurations.length,
  ]);

  useEffect(() => {
    if (!activeStatus.playing || current <= 0) {
      return;
    }

    trackAudioStart();
  }, [activeStatus.playing, current, trackAudioStart]);

  useEffect(() => {
    if (progressRatio >= COMPLETION_THRESHOLD || atEnd) {
      trackAudioFinish();
    }
  }, [atEnd, progressRatio, trackAudioFinish]);


  useEffect(() => {
    player.loop = showSoundscapeControls;

    if (!showSoundscapeControls) {
      setPlayerVolume(player, 1);
    }
  }, [player, setPlayerVolume, showSoundscapeControls]);

  useEffect(() => {
    if (!showSoundscapeControls || !timerSeconds || timerSeconds <= 0 || !activeStatus.playing) {
      return;
    }

    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null) {
          return prev;
        }
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeStatus.playing, showSoundscapeControls, timerSeconds]);

  useEffect(() => {
    if (activeStatus.playing) {
      return;
    }
    clearFadeOutInterval();
  }, [activeStatus.playing, clearFadeOutInterval]);

  const fadeOutAndStop = useCallback(() => {
    clearFadeOutInterval();

    const start = Date.now();
    const durationMs = FADE_OUT_SECONDS * 1000;
    fadeOutIntervalRef.current = setInterval(() => {
      const progress = Math.min((Date.now() - start) / durationMs, 1);
      setPlayerVolume(player, 1 - progress);
      if (progress >= 1) {
        clearFadeOutInterval();
        pauseAll();
        try {
          player.seekTo(0);
        } catch {
          // no-op
        }
        setPlayerVolume(player, 1);
      }
    }, 250);
  }, [clearFadeOutInterval, pauseAll, player, setPlayerVolume]);

  useEffect(() => {
    if (!showSoundscapeControls || timerRemaining === null || timerRemaining > 0) {
      return;
    }
    fadeOutAndStop();
    setTimerRemaining(timerSeconds);
  }, [fadeOutAndStop, showSoundscapeControls, timerRemaining, timerSeconds]);

  useEffect(() => {
    return () => {
      closeAudioUsageSession();
      clearFadeOutInterval();
      clearRetryTimeouts();
      pauseAll();
      resetPlayers();
    };
  }, [clearFadeOutInterval, clearRetryTimeouts, pauseAll, resetPlayers, closeAudioUsageSession]);

  return {
    track,
    activeStatus,
    duration,
    current,
    progressRatio,
    atEnd,
    isPlaylistSession,
    showSoundscapeControls,
    isSessionActive,
    hasSessionStarted,
    sessionDuration,
    sessionCurrent,
    sessionProgressRatio,
    playlistIndex,
    timerSeconds,
    timerRemaining,
    onTogglePlay,
    onRestart,
    onSeek,
    handleTimerSelect,
    handleStop,
    resetPlayers,
    resetSessionState,
    playbackError,
  };
}
