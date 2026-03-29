import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { saveNightSessionCompletion, type NightSessionMode } from "../services/nightSessions";
import { trackEvent } from "../services/analytics";

const FADE_OUT_SECONDS = 5;
const SOUNDSCAPE_LOOP_SECONDS = 20;
const COMPLETION_THRESHOLD = 0.8;

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

  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sessionCompletionLockRef = useRef(false);
  const hasInitializedTrackRef = useRef(false);
  const hasTrackedTrackPlayRef = useRef(false);
  const hasTrackedTrackEndRef = useRef(false);
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

      let attempts = 12;
      const attemptPlay = () => {
        if (attempts <= 0) {
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
    try {
      primaryPlayer.seekTo(0);
    } catch {
      // no-op
    }
    playWithRetry(primaryPlayer);
  }, [playWithRetry, primaryPlayer, resetPlayers]);

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

    void trackEvent("audio_play", {
      audio_id: currentAudioId,
      is_tailored: isTailoredSession,
      playlist_index: playlistIndex,
    });
  }, [currentAudioId, isTailoredSession, playlistIndex]);

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
            hasTrackedTailoredStartRef.current = true;
            void trackEvent("tailored_session_start", {
              session_mode: sleepMode,
            });
          }
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
      }
      trackTrackPlay();
      playWithRetry(activePlayer);
    } catch {
      // no-op
    }
  }, [
    activePlayer,
    activeStatus.playing,
    atEnd,
    hasSessionStarted,
    isTailoredSession,
    pauseAll,
    playWithRetry,
    sleepMode,
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
        hasTrackedTailoredStartRef.current = true;
        void trackEvent("tailored_session_start", {
          session_mode: sleepMode,
        });
      }
      return;
    }

    try {
      resetPlayers();
      trackTrackPlay();
      playWithRetry(primaryPlayer);
    } catch {
      // no-op
    }
  }, [isTailoredSession, playWithRetry, primaryPlayer, resetPlayers, sleepMode, trackTrackPlay]);

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
    hasTrackedTrackEndRef.current = true;

    void trackEvent("audio_complete", {
      audio_id: currentAudioId,
      is_tailored: isTailoredSession,
      playlist_index: playlistIndex,
    });
  }, [currentAudioId, isTailoredSession, playlistIndex]);

  const trackTrackAbandon = useCallback(() => {
    if (hasTrackedTrackEndRef.current || !hasTrackedTrackPlayRef.current) {
      return;
    }
    if (progressRatio >= COMPLETION_THRESHOLD) {
      trackTrackCompletion();
      return;
    }
    hasTrackedTrackEndRef.current = true;

    void trackEvent("audio_abandon", {
      audio_id: currentAudioId,
      is_tailored: isTailoredSession,
      playlist_index: playlistIndex,
      progress_ratio: progressRatio,
    });
  }, [currentAudioId, isTailoredSession, playlistIndex, progressRatio, trackTrackCompletion]);

  const handleTimerSelect = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
  }, []);

  const handleStop = useCallback(() => {
    resetPlayers();
    setTimerRemaining(timerSeconds);
  }, [resetPlayers, timerSeconds]);

  const resetSessionState = useCallback(() => {
    trackTrackAbandon();
    if (
      isTailoredSession &&
      hasTrackedTailoredStartRef.current &&
      !hasTrackedTailoredEndRef.current &&
      sessionProgressRatio < COMPLETION_THRESHOLD
    ) {
      hasTrackedTailoredEndRef.current = true;
      void trackEvent("tailored_session_dropoff", {
        session_mode: sleepMode,
      });
    }
    pauseAll();
    resetPlayers();
    setPendingTailoredAutoplay(false);
    setHasSessionStarted(false);
    setPlaylistIndex(0);
    hasTrackedTailoredStartRef.current = false;
    hasTrackedTailoredEndRef.current = false;
  }, [isTailoredSession, pauseAll, resetPlayers, sessionProgressRatio, sleepMode, trackTrackAbandon]);

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
    hasTrackedTrackPlayRef.current = false;
    hasTrackedTrackEndRef.current = false;
    resetPlayers();
  }, [resetPlayers, showSoundscapeControls, track.id, trackTrackAbandon]);

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
      setPlaylistIndex((prev) => prev + 1);
      setPendingTailoredAutoplay(true);
      return;
    }

    trackTrackCompletion();
    if (!hasTrackedTailoredEndRef.current) {
      hasTrackedTailoredEndRef.current = true;
      void trackEvent("tailored_session_complete", {
        session_mode: sleepMode,
      });
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
    resetPlayers,
    sleepMode,
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

    if (sessionProgressRatio >= COMPLETION_THRESHOLD) {
      hasTrackedTailoredEndRef.current = true;
      void trackEvent("tailored_session_complete", {
        session_mode: sleepMode,
      });
    }
  }, [hasSessionStarted, isTailoredSession, sessionProgressRatio, sleepMode]);

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
        sessionProgressRatio < COMPLETION_THRESHOLD
      ) {
        void trackEvent("tailored_session_dropoff", {
          session_mode: sleepMode,
        });
      }
      clearFadeOutInterval();
      clearRetryTimeouts();
    };
  }, [
    clearFadeOutInterval,
    clearRetryTimeouts,
    isTailoredSession,
    sessionProgressRatio,
    sleepMode,
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
  };
}
