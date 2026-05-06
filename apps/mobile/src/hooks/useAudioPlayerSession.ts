import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { saveNightSessionCompletion, type NightSessionMode } from "../services/nightSessions";
import { createAudioPlaySessionId, trackEvent } from "../services/analytics";

const FADE_OUT_SECONDS = 5;
const SOUNDSCAPE_LOOP_SECONDS = 20;
const COMPLETION_THRESHOLD = 0.8;
const TAILORED_SESSION_COMPLETE_THRESHOLD = 0.995;

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
  sleepMode?: NightSessionMode;
};

export function useAudioPlayerSession({ audioId, playlistIds, sleepMode }: UseAudioPlayerSessionArgs) {
  const normalizedPlaylistIds = useMemo(() => {
    const sourceIds = playlistIds && playlistIds.length > 0 ? playlistIds : [audioId];
    return sourceIds.filter((value, index, arr) => arr.indexOf(value) === index);
  }, [audioId, playlistIds]);

  const [playlistIndex, setPlaylistIndex] = useState(() => {
    const startIndex = normalizedPlaylistIds.indexOf(audioId);
    return startIndex >= 0 ? startIndex : 0;
  });
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [pendingTailoredAutoplay, setPendingTailoredAutoplay] = useState(false);
  const [activePlayerKey, setActivePlayerKey] = useState<"primary" | "secondary">("primary");
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionCompletionLockRef = useRef(false);
  const hasInitializedTrackRef = useRef(false);
  const hasTrackedTrackPlayRef = useRef(false);
  const hasTrackedTrackEndRef = useRef(false);
  const currentPlaySessionIdRef = useRef<string | null>(null);

  const resetAudioPlayTracking = useCallback(() => {
    hasTrackedTrackPlayRef.current = false;
    hasTrackedTrackEndRef.current = false;
    currentPlaySessionIdRef.current = null;
  }, []);
  const hasTrackedTailoredStartRef = useRef(false);
  const hasTrackedTailoredEndRef = useRef(false);

  const currentAudioId: AudioId = normalizedPlaylistIds[playlistIndex] ?? audioId;
  const track = useMemo(() => getTrackById(currentAudioId), [currentAudioId]);
  const isTailoredSession = normalizedPlaylistIds.length > 1;
  const isSoundscape = track.contentType === "soundscape" && !isTailoredSession;
  const showSoundscapeControls = isSoundscape;
  const trackDurations = useMemo(
    () => normalizedPlaylistIds.map((id) => getTrackById(id).durationSec),
    [normalizedPlaylistIds],
  );

  const primaryPlayer = useAudioPlayer(track.asset, { updateInterval: 250 });
  const secondaryPlayer = useAudioPlayer(track.asset, { updateInterval: 250 });
  const primaryStatus = useAudioPlayerStatus(primaryPlayer);
  const secondaryStatus = useAudioPlayerStatus(secondaryPlayer);

  const activePlayer = activePlayerKey === "primary" ? primaryPlayer : secondaryPlayer;
  const inactivePlayer = activePlayerKey === "primary" ? secondaryPlayer : primaryPlayer;
  const activeStatus = activePlayerKey === "primary" ? primaryStatus : secondaryStatus;
  const inactiveStatus = activePlayerKey === "primary" ? secondaryStatus : primaryStatus;
  const duration = activeStatus.duration || track.durationSec;
  const current = Math.min(activeStatus.currentTime || 0, duration);
  const atEnd = duration > 0 && current >= duration - 0.25;
  const isSessionActive = showSoundscapeControls && (activeStatus.playing || (current > 0 && !atEnd));
  const progressRatio = duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;

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

  const setPlayerVolume = useCallback((player: any, volume: number) => {
    try {
      if (typeof player.setVolume === "function") {
        player.setVolume(volume);
      } else {
        player.volume = volume;
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
    (player: any) => {
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
          player.play();
        } catch {
          // no-op; retry below to handle slow player readiness
        }

        if (player?.playing === true) {
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
      primaryPlayer.pause();
      primaryPlayer.seekTo(0);
    } catch {
      // no-op
    }
    try {
      secondaryPlayer.pause();
      secondaryPlayer.seekTo(0);
    } catch {
      // no-op
    }
    setPlayerVolume(primaryPlayer, 1);
    setPlayerVolume(secondaryPlayer, 0);
    setActivePlayerKey("primary");
    setPlaybackError(null);
  }, [clearFadeOutInterval, primaryPlayer, secondaryPlayer, setPlayerVolume]);

  const pauseAll = useCallback(() => {
    clearRetryTimeouts();
    try {
      primaryPlayer.pause();
    } catch {
      // no-op
    }
    try {
      secondaryPlayer.pause();
    } catch {
      // no-op
    }
  }, [clearRetryTimeouts, primaryPlayer, secondaryPlayer]);

  const startPrimaryFromBeginning = useCallback(() => {
    resetPlayers();
    resetAudioPlayTracking();
    try {
      primaryPlayer.seekTo(0);
    } catch {
      // no-op
    }
    playWithRetry(primaryPlayer);
  }, [playWithRetry, primaryPlayer, resetAudioPlayTracking, resetPlayers]);

  const handleSessionComplete = useCallback(() => {
    if (!sleepMode || sessionCompletionLockRef.current) {
      return;
    }

    sessionCompletionLockRef.current = true;
    void saveNightSessionCompletion({
      mode: sleepMode,
      stressBefore: 3,
      stressAfter: 3,
    }).finally(() => {
      setTimeout(() => {
        sessionCompletionLockRef.current = false;
      }, 500);
    });
  }, [sleepMode]);

  const trackTrackPlay = useCallback(() => {
    if (hasTrackedTrackPlayRef.current) {
      return;
    }
    hasTrackedTrackPlayRef.current = true;
    hasTrackedTrackEndRef.current = false;
    currentPlaySessionIdRef.current = createAudioPlaySessionId();

    void trackEvent("audio_start", {
      audio_id: currentAudioId,
      play_session_id: currentPlaySessionIdRef.current,
    });
  }, [currentAudioId]);

  const onTogglePlay = useCallback(() => {
    try {
      if (isTailoredSession) {
        if (activeStatus.playing) {
          pauseAll();
          return;
        }

        if (!hasSessionStarted) {
          hasTrackedTailoredStartRef.current = false;
          hasTrackedTailoredEndRef.current = false;
          setHasSessionStarted(true);
          setPendingTailoredAutoplay(false);
          if (!hasTrackedTailoredStartRef.current) {
            hasTrackedTailoredStartRef.current = true;          }
          startPrimaryFromBeginning();
          return;
        }

        if (atEnd) {
          activePlayer.seekTo(0);
        }
        playWithRetry(activePlayer);
        return;
      }

      if (activeStatus.playing) {
        pauseAll();
        return;
      }

      if (atEnd) {
        activePlayer.seekTo(0);
        resetAudioPlayTracking();
      }
      trackTrackPlay();
      setPlaybackError(null);
      playWithRetry(activePlayer);
    } catch {
      setPlaybackError("play_failed");
    }
  }, [
    activePlayer,
    activeStatus.playing,
    atEnd,
    hasSessionStarted,
    isTailoredSession,
    pauseAll,
    playWithRetry,
    resetAudioPlayTracking,
    startPrimaryFromBeginning,
    trackTrackPlay,
  ]);

  const onRestart = useCallback(() => {
    if (isTailoredSession) {
      hasTrackedTailoredStartRef.current = false;
      hasTrackedTailoredEndRef.current = false;
      setPlaylistIndex(0);
      setHasSessionStarted(true);
      setPendingTailoredAutoplay(true);
      if (!hasTrackedTailoredStartRef.current) {
        hasTrackedTailoredStartRef.current = true;      }
      return;
    }

    try {
      resetPlayers();
      resetAudioPlayTracking();
      trackTrackPlay();
      playWithRetry(primaryPlayer);
    } catch {
      // no-op
    }
  }, [isTailoredSession, playWithRetry, primaryPlayer, resetAudioPlayTracking, resetPlayers, trackTrackPlay]);

  const onSeek = useCallback(
    (value: number) => {
      try {
        if (isTailoredSession) {
          return;
        }
        activePlayer.seekTo(value);
      } catch {
        // no-op
      }
    },
    [activePlayer, isTailoredSession],
  );

  const trackTrackCompletion = useCallback(() => {
    if (hasTrackedTrackEndRef.current) {
      return;
    }
    if (!currentPlaySessionIdRef.current) {
      return;
    }

    hasTrackedTrackEndRef.current = true;

    void trackEvent("audio_finish", {
      audio_id: currentAudioId,
      play_session_id: currentPlaySessionIdRef.current,
      progress_ratio: Math.max(COMPLETION_THRESHOLD, Math.min(progressRatio || 1, 1)),
    });
  }, [currentAudioId, progressRatio]);

  const trackTrackAbandon = useCallback(() => {
    if (hasTrackedTrackEndRef.current || !hasTrackedTrackPlayRef.current) {
      return;
    }
    if (progressRatio >= COMPLETION_THRESHOLD) {
      trackTrackCompletion();
      return;
    }
    hasTrackedTrackEndRef.current = true;
  }, [progressRatio, trackTrackCompletion]);

  const handleTimerSelect = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
    setPlaybackError(null);
  }, []);

  const handleStop = useCallback(() => {
    trackTrackAbandon();
    resetAudioPlayTracking();
    resetPlayers();
    setTimerRemaining(timerSeconds);
  }, [resetAudioPlayTracking, resetPlayers, timerSeconds, trackTrackAbandon]);

  const resetSessionState = useCallback(() => {
    trackTrackAbandon();
    if (
      isTailoredSession &&
      hasTrackedTailoredStartRef.current &&
      !hasTrackedTailoredEndRef.current &&
      sessionProgressRatio < TAILORED_SESSION_COMPLETE_THRESHOLD
    ) {
      hasTrackedTailoredEndRef.current = true;
    }
    pauseAll();
    resetPlayers();
    resetAudioPlayTracking();
    setPendingTailoredAutoplay(false);
    setHasSessionStarted(false);
    setPlaylistIndex(0);
    setTimerRemaining(timerSeconds);
    hasTrackedTailoredStartRef.current = false;
    hasTrackedTailoredEndRef.current = false;
  }, [
    isTailoredSession,
    pauseAll,
    resetAudioPlayTracking,
    resetPlayers,
    sessionProgressRatio,
    timerSeconds,
    trackTrackAbandon,
  ]);

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

    trackTrackAbandon();
    resetAudioPlayTracking();
    resetPlayers();
  }, [resetAudioPlayTracking, resetPlayers, showSoundscapeControls, track.id, trackTrackAbandon]);

  useEffect(() => {
    if (!isTailoredSession || !pendingTailoredAutoplay) {
      return;
    }

    setPendingTailoredAutoplay(false);
    setHasSessionStarted(true);
    startPrimaryFromBeginning();
  }, [isTailoredSession, pendingTailoredAutoplay, startPrimaryFromBeginning]);

  useEffect(() => {
    if (!isTailoredSession || !hasSessionStarted || activeStatus.playing || !atEnd) {
      return;
    }

    if (playlistIndex < trackDurations.length - 1) {
      trackTrackCompletion();
      resetAudioPlayTracking();
      setPlaylistIndex((prev) => prev + 1);
      setPendingTailoredAutoplay(true);
      return;
    }

    trackTrackCompletion();
    if (!hasTrackedTailoredEndRef.current) {
      hasTrackedTailoredEndRef.current = true;
    }
    handleSessionComplete();
    resetPlayers();
    setHasSessionStarted(false);
    setPlaylistIndex(0);
  }, [
    activeStatus.playing,
    atEnd,
    handleSessionComplete,
    hasSessionStarted,
    isTailoredSession,
    playlistIndex,
    resetAudioPlayTracking,
    resetPlayers,
    trackTrackCompletion,
    trackDurations.length,
  ]);

  useEffect(() => {
    if (!activeStatus.playing || current <= 0) {
      return;
    }

    trackTrackPlay();
  }, [activeStatus.playing, current, trackTrackPlay]);

  useEffect(() => {
    if (hasTrackedTrackEndRef.current || !hasTrackedTrackPlayRef.current) {
      return;
    }
    if (progressRatio >= COMPLETION_THRESHOLD || atEnd) {
      trackTrackCompletion();
    }
  }, [atEnd, progressRatio, trackTrackCompletion]);

  useEffect(() => {
    if (
      !isTailoredSession ||
      !hasSessionStarted ||
      hasTrackedTailoredEndRef.current ||
      !hasTrackedTailoredStartRef.current
    ) {
      return;
    }

    if (sessionProgressRatio >= TAILORED_SESSION_COMPLETE_THRESHOLD) {
      hasTrackedTailoredEndRef.current = true;
    }
  }, [hasSessionStarted, isTailoredSession, sessionProgressRatio]);

  useEffect(() => {
    if (!showSoundscapeControls || !activeStatus.playing || !duration) {
      return;
    }

    const loopStart = Math.max(0, duration - SOUNDSCAPE_LOOP_SECONDS);
    if (current < loopStart) {
      setPlayerVolume(activePlayer, 1);
      setPlayerVolume(inactivePlayer, 0);
      return;
    }

    if (!inactiveStatus.playing) {
      try {
        inactivePlayer.seekTo(0);
        inactivePlayer.play();
      } catch {
        // no-op
      }
    }

    const fadeProgress = duration > loopStart ? (current - loopStart) / (duration - loopStart) : 1;
    setPlayerVolume(activePlayer, Math.max(0, 1 - fadeProgress));
    setPlayerVolume(inactivePlayer, Math.min(1, fadeProgress));

    if (atEnd) {
      try {
        activePlayer.pause();
        activePlayer.seekTo(0);
      } catch {
        // no-op
      }
      setPlayerVolume(activePlayer, 0);
      setPlayerVolume(inactivePlayer, 1);
      setActivePlayerKey((prev) => (prev === "primary" ? "secondary" : "primary"));
    }
  }, [
    activePlayer,
    activeStatus.playing,
    atEnd,
    current,
    duration,
    inactivePlayer,
    inactiveStatus.playing,
    showSoundscapeControls,
    setPlayerVolume,
  ]);

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
      setPlayerVolume(activePlayer, 1 - progress);
      if (progress >= 1) {
        clearFadeOutInterval();
        pauseAll();
        try {
          activePlayer.seekTo(0);
        } catch {
          // no-op
        }
        try {
          inactivePlayer.seekTo(0);
        } catch {
          // no-op
        }
        setPlayerVolume(activePlayer, 1);
        setPlayerVolume(inactivePlayer, 0);
      }
    }, 250);
  }, [activePlayer, clearFadeOutInterval, inactivePlayer, pauseAll, setPlayerVolume]);

  useEffect(() => {
    if (!showSoundscapeControls || timerRemaining === null || timerRemaining > 0) {
      return;
    }
    fadeOutAndStop();
    setTimerRemaining(timerSeconds);
  }, [fadeOutAndStop, showSoundscapeControls, timerRemaining, timerSeconds]);

  useEffect(() => {
    return () => {
      trackTrackAbandon();
      if (
        isTailoredSession &&
        hasTrackedTailoredStartRef.current &&
        !hasTrackedTailoredEndRef.current &&
        sessionProgressRatio < TAILORED_SESSION_COMPLETE_THRESHOLD
      ) {      }
      clearFadeOutInterval();
      clearRetryTimeouts();
      pauseAll();
      resetPlayers();
    };
  }, [
    clearFadeOutInterval,
    clearRetryTimeouts,
    isTailoredSession,
    pauseAll,
    resetAudioPlayTracking,
    resetPlayers,
    sessionProgressRatio,
    trackTrackAbandon,
  ]);

  return {
    track,
    activeStatus,
    duration,
    current,
    progressRatio,
    atEnd,
    isPlaylistSession: isTailoredSession,
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
