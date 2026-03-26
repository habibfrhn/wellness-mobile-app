import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Asset } from "expo-asset";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { saveNightSessionCompletion, type NightSessionMode } from "../services/nightSessions";

const FADE_OUT_SECONDS = 5;

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
  const normalizedPlaylistIds = useMemo(() => {
    const sourceIds = playlistIds && playlistIds.length > 0 ? playlistIds : [audioId];
    return sourceIds.filter((value, index, arr) => arr.indexOf(value) === index);
  }, [audioId, playlistIds]);

  const isTailoredSession = normalizedPlaylistIds.length > 1;
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSourceRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionCompletionLockRef = useRef(false);
  const playlistIndexRef = useRef(playlistIndex);
  const hasSessionStartedRef = useRef(hasSessionStarted);

  const log = useCallback(
    (event: string, payload?: Record<string, unknown>) => {
      if (!isTailoredSession) {
        return;
      }
      if (payload) {
        console.log(`[tailored] ${event}`, payload);
      } else {
        console.log(`[tailored] ${event}`);
      }
    },
    [isTailoredSession],
  );

  if (!audioRef.current && typeof Audio !== "undefined") {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    log("audio-element-created");
  }

  const currentAudioId: AudioId = normalizedPlaylistIds[playlistIndex] ?? audioId;
  const track = useMemo(() => getTrackById(currentAudioId), [currentAudioId]);
  const showSoundscapeControls = track.contentType === "soundscape" && !isTailoredSession;

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

  const pauseWithReason = useCallback(
    (reason: string) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      log("pause-called", { reason, src: audio.src, index: playlistIndexRef.current });
      audio.pause();
    },
    [log],
  );

  const assignTrackSource = useCallback(
    (targetTrack: ReturnType<typeof getTrackById>, reason: string) => {
      const audio = audioRef.current;
      if (!audio) {
        return false;
      }

      const nextSource = getAssetUri(targetTrack.asset);
      if (currentSourceRef.current === nextSource) {
        return false;
      }

      log("src-assigned", { reason, trackId: targetTrack.id, from: currentSourceRef.current, to: nextSource });
      pauseWithReason(`assign-track-source:${reason}`);
      audio.src = nextSource;
      currentSourceRef.current = nextSource;
      audio.loop = targetTrack.contentType === "soundscape" && !isTailoredSession;
      audio.load();
      setCurrent(0);
      setDuration(targetTrack.durationSec);
      setIsLoading(true);
      return true;
    },
    [isTailoredSession, log, pauseWithReason],
  );

  const playCurrent = useCallback(
    async (reason: string) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      log("play-called", {
        reason,
        src: audio.src,
        playlistIndex: playlistIndexRef.current,
        hasSessionStarted: hasSessionStartedRef.current,
      });
      setIsLoading(true);
      try {
        await audio.play();
        log("play-resolved", { reason, src: audio.src });
      } catch (error: unknown) {
        log("play-rejected", {
          reason,
          error: error instanceof Error ? error.message : String(error),
        });
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [log],
  );

  const pause = useCallback(() => {
    pauseWithReason("pause-callback");
  }, [pauseWithReason]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = Math.max(0, seconds);
    setCurrent(audio.currentTime || 0);
  }, []);

  const resetPlayers = useCallback(() => {
    clearFadeOutInterval();
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    pauseWithReason("reset-players");
    audio.currentTime = 0;
    audio.volume = 1;
    setCurrent(0);
    setIsPlaying(false);
  }, [clearFadeOutInterval, pauseWithReason]);

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
  }, [hasSessionStarted, playlistIndex]);

  useEffect(() => {
    log("state-change", {
      hasSessionStarted,
      playlistIndex,
      isPlaying,
      isLoading,
    });
  }, [hasSessionStarted, isLoading, isPlaying, log, playlistIndex]);

  useEffect(() => {
    if (!isTailoredSession) {
      return;
    }
    log("route-params", { audioId, playlistIds: normalizedPlaylistIds, sleepMode });
  }, [audioId, isTailoredSession, log, normalizedPlaylistIds, sleepMode]);

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
      if (isTailoredSession) {
        log("loadedmetadata", { src: audio.src, duration: audio.duration });
      }
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setIsLoading(false);
    };
    const handleCanPlay = () => {
      log("canplay", { src: audio.src });
    };
    const handleTimeUpdate = () => setCurrent(audio.currentTime || 0);
    const handlePlay = () => {
      log("play-event", { src: audio.src, index: playlistIndexRef.current });
      setIsPlaying(true);
    };
    const handlePause = () => {
      log("pause-event", { src: audio.src, index: playlistIndexRef.current });
      setIsPlaying(false);
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      log("ended-event", {
        index: playlistIndexRef.current,
        hasSessionStarted: hasSessionStartedRef.current,
      });

      if (isTailoredSession && hasSessionStartedRef.current && playlistIndexRef.current < normalizedPlaylistIds.length - 1) {
        const nextIndex = playlistIndexRef.current + 1;
        const nextTrack = getTrackById(normalizedPlaylistIds[nextIndex]);
        log("transition-next", {
          from: playlistIndexRef.current,
          to: nextIndex,
          nextTrackId: nextTrack.id,
        });
        setPlaylistIndex(nextIndex);
        assignTrackSource(nextTrack, "ended-next");
        void playCurrent("ended-next");
        return;
      }

      if (isTailoredSession && hasSessionStartedRef.current) {
        handleSessionComplete();
        setHasSessionStarted(false);
        setPlaylistIndex(0);
      }

      setCurrent(0);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      clearFadeOutInterval();
      pauseWithReason("audio-effect-cleanup");
      audio.src = "";
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [
    assignTrackSource,
    clearFadeOutInterval,
    handleSessionComplete,
    isTailoredSession,
    log,
    normalizedPlaylistIds,
    pauseWithReason,
    playCurrent,
  ]);

  useEffect(() => {
    const preferredIndex = isTailoredSession ? 0 : (() => {
      const startIndex = normalizedPlaylistIds.indexOf(audioId);
      return startIndex >= 0 ? startIndex : 0;
    })();

    setPlaylistIndex(preferredIndex);
    setHasSessionStarted(false);
    currentSourceRef.current = null;

    const initialTrack = getTrackById(normalizedPlaylistIds[preferredIndex] ?? audioId);
    assignTrackSource(initialTrack, "route-init");
  }, [assignTrackSource, audioId, isTailoredSession, normalizedPlaylistIds]);

  useEffect(() => {
    if (!isTailoredSession) {
      assignTrackSource(track, "track-change");
      return;
    }

    log("segment-index", { playlistIndex, trackId: track.id, hasSessionStarted });
  }, [assignTrackSource, hasSessionStarted, isTailoredSession, log, playlistIndex, track]);

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
        pauseWithReason("fade-out-complete");
        audio.currentTime = 0;
        audio.volume = 1;
        setCurrent(0);
      }
    }, 250);
  }, [clearFadeOutInterval, pauseWithReason]);

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
        setHasSessionStarted(true);
        const firstTrack = getTrackById(normalizedPlaylistIds[0] ?? audioId);
        setPlaylistIndex(0);
        assignTrackSource(firstTrack, "toggle-first-tailored");
      }

      if (atEnd) {
        audio.currentTime = 0;
      }

      void playCurrent("toggle-play");
      return;
    }

    pause();
  }, [
    assignTrackSource,
    atEnd,
    audioId,
    clearFadeOutInterval,
    hasSessionStarted,
    isTailoredSession,
    normalizedPlaylistIds,
    pause,
    playCurrent,
  ]);

  const onRestart = useCallback(() => {
    if (isTailoredSession) {
      setHasSessionStarted(true);
      const firstTrack = getTrackById(normalizedPlaylistIds[0] ?? audioId);
      setPlaylistIndex(0);
      assignTrackSource(firstTrack, "restart-tailored");
      void playCurrent("restart-tailored");
      return;
    }

    assignTrackSource(track, "restart");
    seekTo(0);
    void playCurrent("restart");
  }, [assignTrackSource, audioId, isTailoredSession, normalizedPlaylistIds, playCurrent, seekTo, track]);

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
