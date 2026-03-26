import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Asset } from "expo-asset";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { saveNightSessionCompletion, type NightSessionMode } from "../services/nightSessions";

const FADE_OUT_SECONDS = 5;
const DEBUG_TAILORED_START = false;

export const TIMER_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 h", seconds: 60 * 60 },
];

type UseWebAudioPlayerSessionArgs = {
  audioId: AudioId;
  playlistIds?: AudioId[];
  sleepMode?: NightSessionMode;
};

function getAssetUri(moduleId: number) {
  const asset = Asset.fromModule(moduleId);
  return asset.localUri ?? asset.uri;
}

export function useWebAudioPlayerSession({
  audioId,
  playlistIds,
  sleepMode,
}: UseWebAudioPlayerSessionArgs) {
  const logTailoredStart = useCallback(
    (message: string, payload?: Record<string, unknown>) => {
      if (!DEBUG_TAILORED_START) {
        return;
      }
      if (payload) {
        console.debug(`[tailored-start] ${message}`, payload);
        return;
      }
      console.debug(`[tailored-start] ${message}`);
    },
    [],
  );

  const normalizedPlaylistIds = useMemo(() => {
    const sourceIds = playlistIds && playlistIds.length > 0 ? playlistIds : [audioId];
    return sourceIds.filter((value, index, arr) => arr.indexOf(value) === index);
  }, [audioId, playlistIds]);

  const [playlistIndex, setPlaylistIndex] = useState(() => {
    const startIndex = normalizedPlaylistIds.indexOf(audioId);
    return startIndex >= 0 ? startIndex : 0;
  });
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  const isTailoredSession = normalizedPlaylistIds.length > 1;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSourceRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionCompletionLockRef = useRef(false);
  const isTailoredStartPendingRef = useRef(false);
  const playlistIndexRef = useRef(playlistIndex);
  const hasSessionStartedRef = useRef(hasSessionStarted);
  const isTailoredSessionRef = useRef(isTailoredSession);
  const playlistLengthRef = useRef(normalizedPlaylistIds.length);
  const onSessionCompleteRef = useRef<() => void>(() => undefined);

  if (!audioRef.current && typeof Audio !== "undefined") {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
  }

  const currentAudioId: AudioId = normalizedPlaylistIds[playlistIndex] ?? audioId;
  const track = useMemo(() => getTrackById(currentAudioId), [currentAudioId]);
  const isSoundscape = track.contentType === "soundscape" && !isTailoredSession;
  const showSoundscapeControls = isSoundscape;
  const trackDurations = useMemo(
    () => normalizedPlaylistIds.map((id) => getTrackById(id).durationSec),
    [normalizedPlaylistIds],
  );

  const effectiveDuration = duration > 0 ? duration : track.durationSec;
  const atEnd = effectiveDuration > 0 && current >= effectiveDuration - 0.25;
  const progressRatio = effectiveDuration > 0 ? Math.min(Math.max(current / effectiveDuration, 0), 1) : 0;
  const isSessionActive = showSoundscapeControls && (isPlaying || (current > 0 && !atEnd));

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

  const clearFadeOutInterval = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const setSourceForTrack = useCallback(
    (targetTrack: ReturnType<typeof getTrackById>) => {
      const audio = audioRef.current;
      if (!audio) {
        return false;
      }

      const nextSource = getAssetUri(targetTrack.asset);
      logTailoredStart("setSourceForTrack", {
        targetTrackId: targetTrack.id,
        sourceChanged: currentSourceRef.current !== nextSource,
      });
      if (currentSourceRef.current === nextSource) {
        return false;
      }

      audio.pause();
      audio.src = nextSource;
      currentSourceRef.current = nextSource;
      audio.loop = targetTrack.contentType === "soundscape" && !isTailoredSession;
      audio.load();
      setCurrent(0);
      setDuration(targetTrack.durationSec);
      setIsLoading(true);
      return true;
    },
    [isTailoredSession, logTailoredStart],
  );

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    setIsLoading(true);
    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = Math.max(0, seconds);
    setCurrent(audio.currentTime || 0);
  }, []);

  const playTailoredFromIndex = useCallback(
    async (targetIndex: number) => {
      const targetId = normalizedPlaylistIds[targetIndex];
      if (!targetId) {
        return;
      }

      const targetTrack = getTrackById(targetId);
      setSourceForTrack(targetTrack);
      setPlaylistIndex(targetIndex);
      await play();
    },
    [normalizedPlaylistIds, play, setSourceForTrack],
  );

  const startTailoredSession = useCallback(() => {
    const audio = audioRef.current;
    const firstTrackId = normalizedPlaylistIds[0] ?? audioId;
    if (!audio || !firstTrackId) {
      return;
    }

    const firstTrack = getTrackById(firstTrackId);
    logTailoredStart("startTailoredSession:begin", {
      firstTrackId,
      hasSessionStarted,
      playlistIndex,
    });
    isTailoredStartPendingRef.current = true;
    setSourceForTrack(firstTrack);
    setPlaylistIndex(0);
    hasSessionStartedRef.current = true;
    setIsLoading(true);

    void audio
      .play()
      .then(() => {
        logTailoredStart("startTailoredSession:play-resolved");
        isTailoredStartPendingRef.current = false;
        setHasSessionStarted(true);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        logTailoredStart("startTailoredSession:play-rejected", {
          error: error instanceof Error ? error.message : String(error),
        });
        isTailoredStartPendingRef.current = false;
        hasSessionStartedRef.current = false;
        setHasSessionStarted(false);
        setIsPlaying(false);
        setIsLoading(false);
      });
  }, [
    audioId,
    hasSessionStarted,
    logTailoredStart,
    normalizedPlaylistIds,
    playlistIndex,
    setSourceForTrack,
  ]);

  const resetPlayers = useCallback(() => {
    clearFadeOutInterval();
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    setCurrent(0);
    setIsPlaying(false);
  }, [clearFadeOutInterval]);

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

  useEffect(() => {
    playlistIndexRef.current = playlistIndex;
    hasSessionStartedRef.current = hasSessionStarted;
    isTailoredSessionRef.current = isTailoredSession;
    playlistLengthRef.current = normalizedPlaylistIds.length;
    onSessionCompleteRef.current = handleSessionComplete;
  }, [
    handleSessionComplete,
    hasSessionStarted,
    isTailoredSession,
    normalizedPlaylistIds.length,
    playlistIndex,
  ]);

  useEffect(() => {
    const assetModules = normalizedPlaylistIds.map((id) => getTrackById(id).asset);
    void Asset.loadAsync(assetModules);
  }, [normalizedPlaylistIds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => setCurrent(audio.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      if (
        isTailoredSessionRef.current &&
        hasSessionStartedRef.current &&
        playlistIndexRef.current < playlistLengthRef.current - 1
      ) {
        void playTailoredFromIndex(playlistIndexRef.current + 1);
        return;
      }

      if (isTailoredSessionRef.current && hasSessionStartedRef.current) {
        onSessionCompleteRef.current();
        setHasSessionStarted(false);
        setPlaylistIndex(0);
      }

      setCurrent(0);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      clearFadeOutInterval();
      audio.pause();
      audio.src = "";
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [clearFadeOutInterval, playTailoredFromIndex]);

  useEffect(() => {
    if (!isTailoredSession || !DEBUG_TAILORED_START) {
      return;
    }
    logTailoredStart("state-change", {
      playlistIndex,
      hasSessionStarted,
      isPlaying,
      isLoading,
      src: audioRef.current?.src ?? null,
      pendingStart: isTailoredStartPendingRef.current,
    });
  }, [
    hasSessionStarted,
    isLoading,
    isPlaying,
    isTailoredSession,
    logTailoredStart,
    playlistIndex,
  ]);

  useEffect(() => {
    setPlaylistIndex((prev) => {
      const preferredIndex = normalizedPlaylistIds.indexOf(audioId);
      const nextIndex = preferredIndex >= 0 ? preferredIndex : 0;
      return prev === nextIndex ? prev : nextIndex;
    });
    setHasSessionStarted(false);
    isTailoredStartPendingRef.current = false;
    currentSourceRef.current = null;
  }, [audioId, normalizedPlaylistIds]);

  useEffect(() => {
    if (isTailoredSession) {
      if (hasSessionStarted || isTailoredStartPendingRef.current) {
        logTailoredStart("prebind-skipped", {
          hasSessionStarted,
          pendingStart: isTailoredStartPendingRef.current,
        });
        return;
      }

      const firstTrack = getTrackById(normalizedPlaylistIds[0] ?? audioId);
      logTailoredStart("prebind-first-track", { firstTrackId: firstTrack.id });
      const sourceChanged = setSourceForTrack(firstTrack);
      if (sourceChanged) {
        clearFadeOutInterval();
      }
      if (playlistIndex !== 0) {
        setPlaylistIndex(0);
      }
      return;
    }

    const sourceChanged = setSourceForTrack(track);
    if (sourceChanged) {
      clearFadeOutInterval();
    }
  }, [
    audioId,
    clearFadeOutInterval,
    hasSessionStarted,
    isTailoredSession,
    normalizedPlaylistIds,
    playlistIndex,
    setSourceForTrack,
    track,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.loop = showSoundscapeControls;
  }, [showSoundscapeControls]);

  useEffect(() => {
    if (showSoundscapeControls) {
      setTimerSeconds(TIMER_OPTIONS[0].seconds);
      setTimerRemaining(TIMER_OPTIONS[0].seconds);
      return;
    }

    setTimerSeconds(null);
    setTimerRemaining(null);
  }, [showSoundscapeControls]);

  useEffect(() => {
    if (!showSoundscapeControls || !timerSeconds || timerSeconds <= 0 || !isPlaying) {
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
  }, [isPlaying, showSoundscapeControls, timerSeconds]);

  const fadeOutAndStop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    clearFadeOutInterval();
    const startVolume = audio.volume;
    const startMs = Date.now();
    const durationMs = FADE_OUT_SECONDS * 1000;

    fadeIntervalRef.current = setInterval(() => {
      const progress = Math.min((Date.now() - startMs) / durationMs, 1);
      audio.volume = Math.max(0, startVolume * (1 - progress));

      if (progress >= 1) {
        clearFadeOutInterval();
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        setCurrent(0);
      }
    }, 250);
  }, [clearFadeOutInterval]);

  useEffect(() => {
    if (!showSoundscapeControls || timerRemaining === null || timerRemaining > 0) {
      return;
    }

    fadeOutAndStop();
    setTimerRemaining(timerSeconds);
  }, [fadeOutAndStop, showSoundscapeControls, timerRemaining, timerSeconds]);

  const onTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    clearFadeOutInterval();

    if (audio.paused) {
      if (isTailoredSession && !hasSessionStarted) {
        if (isTailoredStartPendingRef.current) {
          logTailoredStart("toggle-ignored-pending-start");
          return;
        }
        logTailoredStart("toggle-start-tailored-session");
        startTailoredSession();
        return;
      }

      if (atEnd) {
        audio.currentTime = 0;
      }

      if (!isTailoredSession) {
        setSourceForTrack(track);
      }

      void play();
      return;
    }

    pause();
  }, [
    atEnd,
    clearFadeOutInterval,
    hasSessionStarted,
    isTailoredSession,
    pause,
    play,
    playTailoredFromIndex,
    startTailoredSession,
    setSourceForTrack,
    track,
  ]);

  const onRestart = useCallback(() => {
    if (isTailoredSession) {
      startTailoredSession();
      return;
    }

    setSourceForTrack(track);
    seekTo(0);
    void play();
  }, [isTailoredSession, play, seekTo, setSourceForTrack, startTailoredSession, track]);

  const onSeek = useCallback(
    (value: number) => {
      if (isTailoredSession) {
        return;
      }
      seekTo(value);
    },
    [isTailoredSession, seekTo],
  );

  const handleTimerSelect = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
  }, []);

  const handleStop = useCallback(() => {
    resetPlayers();
    setTimerRemaining(timerSeconds);
  }, [resetPlayers, timerSeconds]);

  const resetSessionState = useCallback(() => {
    setHasSessionStarted(false);
    setPlaylistIndex(0);
    resetPlayers();
  }, [resetPlayers]);

  return {
    track,
    activeStatus: { playing: isPlaying, loading: isLoading },
    duration: effectiveDuration,
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
