import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTrackById } from "../content/audioCatalog";
import type { AudioId } from "../content/audioCatalog";
import { useSleepSessionPlayer } from "./useSleepSessionPlayer";

const FADE_OUT_SECONDS = 5;
const SOUNDSCAPE_LOOP_SECONDS = 20;

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
  const [autoPlayNextTrack, setAutoPlayNextTrack] = useState(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [activePlayerKey, setActivePlayerKey] = useState<"primary" | "secondary">("primary");
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);

  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentAudioId: AudioId = normalizedPlaylistIds[playlistIndex] ?? audioId;
  const track = useMemo(() => getTrackById(currentAudioId), [currentAudioId]);
  const isTailoredSession = normalizedPlaylistIds.length > 1;
  const isSoundscape = track.contentType === "soundscape" && !isTailoredSession;
  const showSoundscapeControls = isSoundscape;
  const playlistTracks = useMemo(() => normalizedPlaylistIds.map((id) => getTrackById(id)), [normalizedPlaylistIds]);
  const playlistDurations = useMemo(() => playlistTracks.map((trackItem) => trackItem.durationSec), [playlistTracks]);

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
  }, [primaryPlayer, secondaryPlayer]);

  const sleepSessionPlayer = useSleepSessionPlayer({
    isTailoredSession,
    trackDurations: playlistDurations,
    playlistIndex,
    setPlaylistIndex,
    current,
    activeStatusPlaying: activeStatus.playing,
    atEnd,
    hasSessionStarted,
    setHasSessionStarted,
    autoPlayNextTrack,
    setAutoPlayNextTrack,
    activePlayer,
    primaryPlayer,
    pauseAll,
    resetPlayers,
  });

  const onTogglePlay = useCallback(() => {
    try {
      if (isTailoredSession) {
        sleepSessionPlayer.onTogglePlay();
        return;
      }

      if (activeStatus.playing) {
        pauseAll();
        return;
      }

      if (atEnd) {
        activePlayer.seekTo(0);
      }
      activePlayer.play();
    } catch {
      // no-op
    }
  }, [activePlayer, activeStatus.playing, atEnd, isTailoredSession, pauseAll, sleepSessionPlayer]);

  const onRestart = useCallback(() => {
    if (isTailoredSession) {
      sleepSessionPlayer.onRestart();
      return;
    }

    try {
      resetPlayers();
      primaryPlayer.play();
    } catch {
      // no-op
    }
  }, [isTailoredSession, primaryPlayer, resetPlayers, sleepSessionPlayer]);

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

  const handleTimerSelect = useCallback((seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
  }, []);

  const handleStop = useCallback(() => {
    resetPlayers();
    setTimerRemaining(timerSeconds);
  }, [resetPlayers, timerSeconds]);

  const resetSessionState = useCallback(() => {
    pauseAll();
    resetPlayers();
    setAutoPlayNextTrack(false);
    setHasSessionStarted(false);
    setPlaylistIndex(0);
  }, [pauseAll, resetPlayers]);

  useEffect(() => {
    if (showSoundscapeControls) {
      setTimerSeconds(TIMER_OPTIONS[0].seconds);
      setTimerRemaining(TIMER_OPTIONS[0].seconds);
    } else {
      setTimerSeconds(null);
      setTimerRemaining(null);
    }
    resetPlayers();
  }, [resetPlayers, showSoundscapeControls, track.id]);

  useEffect(() => {
    if (!showSoundscapeControls) {
      setTimerSeconds(null);
      setTimerRemaining(null);
    }
  }, [showSoundscapeControls]);

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
      clearFadeOutInterval();
    };
  }, [clearFadeOutInterval]);

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
    sessionDuration: sleepSessionPlayer.sessionDuration,
    sessionCurrent: sleepSessionPlayer.sessionCurrent,
    sessionProgressRatio: sleepSessionPlayer.sessionProgressRatio,
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
