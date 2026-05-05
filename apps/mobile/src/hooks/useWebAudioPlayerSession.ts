import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Asset } from "expo-asset";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { saveNightSessionCompletion, type NightSessionMode } from "../services/nightSessions";
import { trackEvent } from "../services/analytics";

const FADE_OUT_SECONDS = 5;
const TAILORED_TRANSITION_FADE_OUT_MS = 160;
const TAILORED_TRANSITION_FADE_IN_MS = 360;
const VOLUME_TICK_MS = 40;
const PLAY_RETRY_DELAY_MS = 140;
const PLAY_RETRY_ATTEMPTS = 5;
const TAILORED_PROGRESS_TICK_MS = 120;
const COMPLETION_THRESHOLD = 0.8;
const TAILORED_SESSION_COMPLETE_THRESHOLD = 0.995;

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

type TailoredTrackPlan = {
  startOffsetSec: number;
  endAtSec: number | null;
  fadeInSec: number;
  fadeOutSec: number;
};

function getTailoredTrackPlan(audioId: AudioId, index: number, durationSec: number): TailoredTrackPlan {
  if (index === 0 && audioId === "terima_diri") {
    return { startOffsetSec: 0, endAtSec: 160, fadeInSec: 0, fadeOutSec: 5 };
  }

  if (index === 0 && audioId === "syukuri_hari") {
    return { startOffsetSec: 0, endAtSec: durationSec, fadeInSec: 0, fadeOutSec: 5 };
  }

  if (index > 0 && audioId === "persiapan_tidur") {
    return { startOffsetSec: 5, endAtSec: durationSec, fadeInSec: 5, fadeOutSec: 10 };
  }

  if (index > 0 && (audioId === "hening" || audioId === "rintik-hujan" || audioId === "ombak-laut")) {
    return { startOffsetSec: 0, endAtSec: durationSec, fadeInSec: 10, fadeOutSec: 10 };
  }

  return { startOffsetSec: 0, endAtSec: durationSec, fadeInSec: 0, fadeOutSec: 0 };
}

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
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedAudioRefs = useRef(new Map<string, HTMLAudioElement>());
  const currentSourceRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionCompletionLockRef = useRef(false);
  const playlistIndexRef = useRef(playlistIndex);
  const hasSessionStartedRef = useRef(hasSessionStarted);
  const transitionRequestRef = useRef(0);
  const tailoredProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTailoredSessionRef = useRef(isTailoredSession);
  const normalizedPlaylistIdsRef = useRef(normalizedPlaylistIds);
  const trackTrackCompletionRef = useRef<() => void>(() => {});
  const trackTailoredCompleteRef = useRef<() => void>(() => {});
  const handleSessionCompleteRef = useRef<() => void>(() => {});
  const transitionToIndexRef = useRef<(nextIndex: number) => Promise<void>>(async () => {});
  const hasTrackedTrackPlayRef = useRef(false);
  const hasTrackedTrackEndRef = useRef(false);
  const hasTrackedTailoredStartRef = useRef(false);
  const hasTrackedTailoredEndRef = useRef(false);

  const getOrCreateAudio = useCallback(() => {
    if (audioRef.current) {
      return audioRef.current;
    }
    if (typeof Audio === "undefined") {
      return null;
    }

    const audio = new Audio();
    // MVP-safe default: avoid eager full-file fetches before the user actually plays audio.
    audio.preload = "auto";
    audioRef.current = audio;
    return audio;
  }, []);

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

  const clearTailoredProgressInterval = useCallback(() => {
    if (tailoredProgressIntervalRef.current) {
      clearInterval(tailoredProgressIntervalRef.current);
      tailoredProgressIntervalRef.current = null;
    }
  }, []);

  const fadeVolume = useCallback(
    (audio: HTMLAudioElement, from: number, to: number, durationMs: number, requestId?: number) => {
      clearFadeOutInterval();

      if (durationMs <= 0 || from === to) {
        audio.volume = to;
        return Promise.resolve();
      }

      audio.volume = from;
      const startMs = Date.now();

      return new Promise<void>((resolve) => {
        fadeIntervalRef.current = setInterval(() => {
          if (requestId !== undefined && transitionRequestRef.current !== requestId) {
            clearFadeOutInterval();
            resolve();
            return;
          }

          const progress = Math.min((Date.now() - startMs) / durationMs, 1);
          audio.volume = from + (to - from) * progress;

          if (progress >= 1) {
            clearFadeOutInterval();
            audio.volume = to;
            resolve();
          }
        }, VOLUME_TICK_MS);
      });
    },
    [clearFadeOutInterval],
  );

  const assignTrackSource = useCallback(
    (targetTrack: ReturnType<typeof getTrackById>) => {
      const audio = getOrCreateAudio();
      if (!audio) {
        return false;
      }

      const nextSource = getAssetUri(targetTrack.asset);
      if (currentSourceRef.current === nextSource) {
        return false;
      }

      audio.pause();
      audio.src = nextSource;
      audio.loop = targetTrack.contentType === "soundscape" && !isTailoredSession;
      audio.load();

      currentSourceRef.current = nextSource;
      setCurrent(0);
      setDuration(targetTrack.durationSec);
      setIsLoading(true);
      return true;
    },
    [getOrCreateAudio, isTailoredSession],
  );

  const playAudio = useCallback(async () => {
    const audio = getOrCreateAudio();
    if (!audio) {
      return;
    }

    setIsLoading(true);
    setPlaybackError(null);
    for (let attempt = 0; attempt < PLAY_RETRY_ATTEMPTS; attempt += 1) {
      try {
        await audio.play();
        setIsLoading(false);
        return;
      } catch {
        if (attempt >= PLAY_RETRY_ATTEMPTS - 1) {
          setIsPlaying(false);
          setIsLoading(false);
          setPlaybackError("play_failed");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, PLAY_RETRY_DELAY_MS));
      }
    }
  }, [getOrCreateAudio]);

  const pause = useCallback(() => {
    const audio = getOrCreateAudio();
    if (!audio) {
      return;
    }
    audio.pause();
  }, [getOrCreateAudio]);

  const seekTo = useCallback(
    (seconds: number) => {
      const audio = getOrCreateAudio();
      if (!audio) {
        return;
      }

      audio.currentTime = Math.max(0, seconds);
      setCurrent(audio.currentTime || 0);
    },
    [getOrCreateAudio],
  );

  const resetPlayers = useCallback(() => {
    clearFadeOutInterval();
    clearTailoredProgressInterval();
    transitionRequestRef.current += 1;

    const audio = getOrCreateAudio();
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    setCurrent(0);
    setIsPlaying(false);
    setPlaybackError(null);
  }, [clearFadeOutInterval, clearTailoredProgressInterval, getOrCreateAudio]);

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

  const trackTailoredStart = useCallback(() => {
    if (!isTailoredSession || hasTrackedTailoredStartRef.current) {
      return;
    }
    hasTrackedTailoredStartRef.current = true;
    hasTrackedTailoredEndRef.current = false;
  }, [isTailoredSession, sleepMode]);

  const trackTailoredComplete = useCallback(() => {
    if (!isTailoredSession || hasTrackedTailoredEndRef.current || !hasTrackedTailoredStartRef.current) {
      return;
    }
    hasTrackedTailoredEndRef.current = true;
  }, [isTailoredSession, sleepMode]);

  const transitionToIndex = useCallback(
    async (nextIndex: number) => {
      const nextTrackId = normalizedPlaylistIds[nextIndex];
      if (!nextTrackId) {
        return;
      }

      const audio = getOrCreateAudio();
      if (!audio) {
        return;
      }

      transitionRequestRef.current += 1;
      const requestId = transitionRequestRef.current;

      if (!audio.paused) {
        await fadeVolume(audio, audio.volume, 0, TAILORED_TRANSITION_FADE_OUT_MS, requestId);
      }

      if (transitionRequestRef.current !== requestId) {
        return;
      }

      const nextTrack = getTrackById(nextTrackId);
      const nextTrackPlan = getTailoredTrackPlan(nextTrack.id, nextIndex, nextTrack.durationSec);
      setPlaylistIndex(nextIndex);
      assignTrackSource(nextTrack);

      audio.currentTime = nextTrackPlan.startOffsetSec;
      audio.volume = nextTrackPlan.fadeInSec > 0 ? 0 : 1;
      await playAudio();

      if (transitionRequestRef.current !== requestId) {
        return;
      }

      if (nextTrackPlan.fadeInSec > 0) {
        await fadeVolume(audio, 0, 1, nextTrackPlan.fadeInSec * 1000, requestId);
      } else {
        await fadeVolume(audio, 0, 1, TAILORED_TRANSITION_FADE_IN_MS, requestId);
      }
    },
    [assignTrackSource, fadeVolume, getOrCreateAudio, normalizedPlaylistIds, playAudio],
  );

  useEffect(() => {
    isTailoredSessionRef.current = isTailoredSession;
    normalizedPlaylistIdsRef.current = normalizedPlaylistIds;
  }, [isTailoredSession, normalizedPlaylistIds]);

  useEffect(() => {
    playlistIndexRef.current = playlistIndex;
    hasSessionStartedRef.current = hasSessionStarted;
  }, [hasSessionStarted, playlistIndex]);

  useEffect(() => {
    const preloadTracks = async () => {
      const tracks = normalizedPlaylistIds.map((id) => getTrackById(id));
      await Asset.loadAsync(tracks.map((item) => item.asset));

      tracks.forEach((item) => {
        const src = getAssetUri(item.asset);
        if (!src || preloadedAudioRefs.current.has(src) || typeof Audio === "undefined") {
          return;
        }
        const preloadAudio = new Audio(src);
        preloadAudio.preload = "auto";
        preloadAudio.load();
        preloadedAudioRefs.current.set(src, preloadAudio);
      });
    };

    void preloadTracks();
  }, [normalizedPlaylistIds]);

  useEffect(() => {
    trackTrackCompletionRef.current = trackTrackCompletion;
    trackTailoredCompleteRef.current = trackTailoredComplete;
    handleSessionCompleteRef.current = handleSessionComplete;
    transitionToIndexRef.current = transitionToIndex;
  }, [handleSessionComplete, trackTailoredComplete, trackTrackCompletion, transitionToIndex]);

  useEffect(() => {
    const audio = getOrCreateAudio();
    if (!audio) {
      return;
    }
    const preloadedAudios = preloadedAudioRefs.current;

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
      setPlaybackError("play_failed");
    };

    const handleEnded = () => {
      const currentIndex = playlistIndexRef.current;
      const isTailored = isTailoredSessionRef.current;
      const playlist = normalizedPlaylistIdsRef.current;

      if (isTailored && hasSessionStartedRef.current && currentIndex < playlist.length - 1) {
        trackTrackCompletionRef.current();
        hasTrackedTrackPlayRef.current = false;
        hasTrackedTrackEndRef.current = false;
        void transitionToIndexRef.current(currentIndex + 1);
        return;
      }

      if (isTailored && hasSessionStartedRef.current) {
        trackTrackCompletionRef.current();
        trackTailoredCompleteRef.current();
        handleSessionCompleteRef.current();
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
      clearTailoredProgressInterval();
      transitionRequestRef.current += 1;
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
      preloadedAudios.forEach((item) => {
        item.pause();
        item.src = "";
      });
      preloadedAudios.clear();
      audioRef.current = null;
    };
  }, [clearFadeOutInterval, clearTailoredProgressInterval, getOrCreateAudio]);

  useEffect(() => {
    const preferredIndex = isTailoredSession
      ? 0
      : (() => {
          const startIndex = normalizedPlaylistIds.indexOf(audioId);
          return startIndex >= 0 ? startIndex : 0;
        })();

    transitionRequestRef.current += 1;
    setPlaylistIndex(preferredIndex);
    setHasSessionStarted(false);
    currentSourceRef.current = null;

    const initialTrack = getTrackById(normalizedPlaylistIds[preferredIndex] ?? audioId);
    assignTrackSource(initialTrack);
  }, [assignTrackSource, audioId, isTailoredSession, normalizedPlaylistIds]);

  useEffect(() => {
    if (!isTailoredSession) {
      assignTrackSource(track);
    }
  }, [assignTrackSource, isTailoredSession, track]);

  useEffect(() => {
    hasTrackedTrackPlayRef.current = false;
    hasTrackedTrackEndRef.current = false;
  }, [currentAudioId]);

  useEffect(() => {
    const audio = getOrCreateAudio();
    if (!audio) {
      return;
    }
    audio.loop = showSoundscapeControls;
  }, [getOrCreateAudio, showSoundscapeControls]);

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

  useEffect(() => {
    if (!isTailoredSession || !hasSessionStarted || !isPlaying) {
      clearTailoredProgressInterval();
      return;
    }

    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      const currentIndex = playlistIndexRef.current;
      const currentTrackId = normalizedPlaylistIds[currentIndex];
      if (!currentTrackId) {
        return;
      }

      const currentTrack = getTrackById(currentTrackId);
      const currentPlan = getTailoredTrackPlan(currentTrack.id, currentIndex, currentTrack.durationSec);
      const endAtSec = currentPlan.endAtSec ?? currentTrack.durationSec;
      const fadeOutStartSec = Math.max(currentPlan.startOffsetSec, endAtSec - currentPlan.fadeOutSec);

      if (currentPlan.fadeOutSec > 0 && audio.currentTime >= fadeOutStartSec) {
        const fadeProgress = Math.min((audio.currentTime - fadeOutStartSec) / currentPlan.fadeOutSec, 1);
        audio.volume = Math.max(0, 1 - fadeProgress);
      } else if (audio.volume !== 1) {
        audio.volume = 1;
      }

      if (audio.currentTime < endAtSec) {
        return;
      }

      if (currentIndex < normalizedPlaylistIds.length - 1) {
        trackTrackCompletion();
        hasTrackedTrackPlayRef.current = false;
        hasTrackedTrackEndRef.current = false;
        void transitionToIndex(currentIndex + 1);
        return;
      }

      trackTrackCompletion();
      trackTailoredComplete();
      handleSessionComplete();
      setHasSessionStarted(false);
      setPlaylistIndex(0);
      setIsPlaying(false);
      setCurrent(0);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
    }, TAILORED_PROGRESS_TICK_MS);

    tailoredProgressIntervalRef.current = interval;
    return () => clearTailoredProgressInterval();
  }, [
    clearTailoredProgressInterval,
    handleSessionComplete,
    hasSessionStarted,
    isPlaying,
    isTailoredSession,
    normalizedPlaylistIds,
    trackTailoredComplete,
    trackTrackCompletion,
    transitionToIndex,
  ]);

  const fadeOutAndStop = useCallback(() => {
    const audio = getOrCreateAudio();
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
  }, [clearFadeOutInterval, getOrCreateAudio]);

  useEffect(() => {
    if (!showSoundscapeControls || timerRemaining === null || timerRemaining > 0) {
      return;
    }

    fadeOutAndStop();
    setTimerRemaining(timerSeconds);
  }, [fadeOutAndStop, showSoundscapeControls, timerRemaining, timerSeconds]);

  const onTogglePlay = useCallback(() => {
    const audio = getOrCreateAudio();
    if (!audio) {
      return;
    }

    clearFadeOutInterval();
    transitionRequestRef.current += 1;

    if (audio.paused) {
      setPlaybackError(null);
      if (!currentSourceRef.current) {
        assignTrackSource(track);
      }

      if (isTailoredSession && !hasSessionStarted) {
        hasTrackedTailoredStartRef.current = false;
        hasTrackedTailoredEndRef.current = false;
        setHasSessionStarted(true);
        setPlaylistIndex(0);
        const firstTrack = getTrackById(normalizedPlaylistIds[0] ?? audioId);
        const firstTrackPlan = getTailoredTrackPlan(firstTrack.id, 0, firstTrack.durationSec);
        assignTrackSource(firstTrack);
        audio.currentTime = firstTrackPlan.startOffsetSec;
        audio.volume = firstTrackPlan.fadeInSec > 0 ? 0 : 1;
        trackTailoredStart();
      }

      if (atEnd) {
        audio.currentTime = 0;
      }

      trackTrackPlay();
      void playAudio();
      return;
    }

    pause();
  }, [
    assignTrackSource,
    atEnd,
    audioId,
    clearFadeOutInterval,
    getOrCreateAudio,
    hasSessionStarted,
    isTailoredSession,
    normalizedPlaylistIds,
    pause,
    playAudio,
    track,
    trackTailoredStart,
    trackTrackPlay,
  ]);

  const onRestart = useCallback(() => {
    transitionRequestRef.current += 1;

    if (isTailoredSession) {
      hasTrackedTailoredStartRef.current = false;
      hasTrackedTailoredEndRef.current = false;
      setHasSessionStarted(true);
      setPlaylistIndex(0);
      const firstTrack = getTrackById(normalizedPlaylistIds[0] ?? audioId);
      const firstTrackPlan = getTailoredTrackPlan(firstTrack.id, 0, firstTrack.durationSec);
      assignTrackSource(firstTrack);
      const audio = getOrCreateAudio();
      if (audio) {
        audio.currentTime = firstTrackPlan.startOffsetSec;
        audio.volume = firstTrackPlan.fadeInSec > 0 ? 0 : 1;
      }
      trackTailoredStart();
      trackTrackPlay();
      void playAudio();
      return;
    }

    assignTrackSource(track);
    seekTo(0);
    trackTrackPlay();
    void playAudio();
  }, [
    assignTrackSource,
    audioId,
    getOrCreateAudio,
    isTailoredSession,
    normalizedPlaylistIds,
    playAudio,
    seekTo,
    track,
    trackTailoredStart,
    trackTrackPlay,
  ]);

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
    setPlaybackError(null);
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
      sessionProgressRatio < TAILORED_SESSION_COMPLETE_THRESHOLD
    ) {
      hasTrackedTailoredEndRef.current = true;
      }
    setHasSessionStarted(false);
    setPlaylistIndex(0);
    resetPlayers();
    setTimerRemaining(timerSeconds);
    hasTrackedTailoredStartRef.current = false;
    hasTrackedTailoredEndRef.current = false;
  }, [
    isTailoredSession,
    resetPlayers,
    sessionProgressRatio,
    sleepMode,
    timerSeconds,
    trackTrackAbandon,
  ]);

  useEffect(() => {
    if (hasTrackedTrackEndRef.current || !hasTrackedTrackPlayRef.current) {
      return;
    }
    if (progressRatio >= COMPLETION_THRESHOLD || atEnd) {
      trackTrackCompletion();
    }
  }, [atEnd, progressRatio, trackTrackCompletion]);

  useEffect(() => {
    if (!isPlaying || current <= 0) {
      return;
    }

    trackTrackPlay();
  }, [current, isPlaying, trackTrackPlay]);

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
      trackTailoredComplete();
    }
  }, [hasSessionStarted, isTailoredSession, sessionProgressRatio, trackTailoredComplete]);

  useEffect(() => {
    return () => {
      trackTrackAbandon();
      if (
        isTailoredSession &&
        hasTrackedTailoredStartRef.current &&
        !hasTrackedTailoredEndRef.current &&
        sessionProgressRatio < TAILORED_SESSION_COMPLETE_THRESHOLD
      ) {
          }
    };
  }, [isTailoredSession, sessionProgressRatio, sleepMode, trackTrackAbandon]);

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
    playbackError,
  };
}
