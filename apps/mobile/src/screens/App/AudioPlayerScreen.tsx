import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Animated, View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { getTrackById, isFavorite, toggleFavorite } from "../../content/audioCatalog";
import type { AudioId } from "../../content/audioCatalog";
import { colors, spacing, radius, typography, controlSizes } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import SleepSessionExitModal from "../../components/SleepSessionExitModal";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const FADE_OUT_SECONDS = 5;
const SOUNDSCAPE_LOOP_SECONDS = 20;
const TIMER_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 h", seconds: 60 * 60 },
];

export default function AudioPlayerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { audioId, playlistIds, sleepMode } = route.params;
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
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  const currentAudioId: AudioId = normalizedPlaylistIds[playlistIndex] ?? audioId;
  const track = useMemo(() => getTrackById(currentAudioId), [currentAudioId]);
  const isPlaylistSession = normalizedPlaylistIds.length > 1;
  const isSoundscape = track.contentType === "soundscape";
  const showSoundscapeControls = isSoundscape && !isPlaylistSession;
  const playlistTracks = useMemo(() => normalizedPlaylistIds.map((id) => getTrackById(id)), [normalizedPlaylistIds]);
  const elapsedBeforeCurrent = useMemo(
    () => playlistTracks.slice(0, playlistIndex).reduce((sum, item) => sum + item.durationSec, 0),
    [playlistIndex, playlistTracks],
  );
  const sessionDuration = useMemo(
    () => playlistTracks.reduce((sum, item) => sum + item.durationSec, 0),
    [playlistTracks],
  );

  // No autoplay: do not call play() on mount.
  const primaryPlayer = useAudioPlayer(track.asset, { updateInterval: 250 });
  const secondaryPlayer = useAudioPlayer(track.asset, { updateInterval: 250 });
  const primaryStatus = useAudioPlayerStatus(primaryPlayer);
  const secondaryStatus = useAudioPlayerStatus(secondaryPlayer);
  const [progressWidth, setProgressWidth] = useState(0);
  const [favorite, setFavorite] = useState(() => isFavorite(track.id));
  const [activePlayerKey, setActivePlayerKey] = useState<"primary" | "secondary">("primary");
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [showTimerInfo, setShowTimerInfo] = useState(false);
  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExitingSessionRef = useRef(false);
  const artworkOpacity = useRef(new Animated.Value(1)).current;
  const phaseToneOpacity = useRef(new Animated.Value(0.14)).current;
  const startTransitionOpacity = useRef(new Animated.Value(0)).current;
  const [areControlsRevealed, setAreControlsRevealed] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(track.id));
  }, [track.id]);

  const activePlayer = activePlayerKey === "primary" ? primaryPlayer : secondaryPlayer;
  const inactivePlayer = activePlayerKey === "primary" ? secondaryPlayer : primaryPlayer;
  const activeStatus = activePlayerKey === "primary" ? primaryStatus : secondaryStatus;
  const inactiveStatus = activePlayerKey === "primary" ? secondaryStatus : primaryStatus;
  const duration = activeStatus.duration || track.durationSec;
  const current = Math.min(activeStatus.currentTime || 0, duration);
  const atEnd = duration > 0 && current >= duration - 0.25;
  const isSessionActive = showSoundscapeControls && (activeStatus.playing || (current > 0 && !atEnd));
  const progressRatio = duration > 0 ? Math.min(Math.max(current / duration, 0), 1) : 0;
  const progressHandleSize = spacing.xs;
  const progressHandleLeft = progressWidth
    ? Math.min(Math.max(progressRatio * progressWidth - progressHandleSize / 2, 0), progressWidth - progressHandleSize)
    : 0;

  const sessionCurrent = Math.min(sessionDuration, elapsedBeforeCurrent + current);
  const sessionProgressRatio = sessionDuration > 0 ? Math.min(Math.max(sessionCurrent / sessionDuration, 0), 1) : 0;
  const sleepSessionTitle =
    sleepMode === "release_accept" ? id.player.sleepSessionTitleReleaseAccept : id.player.sleepSessionTitleCalmMind;
  const sleepSessionPhase =
    playlistIndex === 0
      ? id.player.sleepSessionPhaseMind
      : playlistIndex === 1
        ? id.player.sleepSessionPhaseBody
        : id.player.sleepSessionPhaseSoundscape;
  const soundscapeControlsOpacity =
    isPlaylistSession && isSoundscape ? Math.max(0.35, 1 - progressRatio * 0.65) : 1;
  const isSoundscapeImmersion = isPlaylistSession && isSoundscape && hasSessionStarted;
  const controlsOpacity = isSoundscapeImmersion
    ? areControlsRevealed
      ? 0.9
      : 0.22
    : soundscapeControlsOpacity;
  const phaseToneColor =
    playlistIndex === 0 ? "#0B1C2D" : playlistIndex === 1 ? "#14243A" : "#070B14";


  useEffect(() => {
    if (!isPlaylistSession) return;
    artworkOpacity.setValue(0);
    Animated.timing(artworkOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [artworkOpacity, isPlaylistSession, track.id]);

  useEffect(() => {
    if (!isPlaylistSession) return;
    const targetOpacity = playlistIndex === 0 ? 0.12 : playlistIndex === 1 ? 0.2 : 0.34;
    Animated.timing(phaseToneOpacity, {
      toValue: targetOpacity,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [isPlaylistSession, phaseToneOpacity, playlistIndex]);

  useEffect(() => {
    if (!isPlaylistSession || !hasSessionStarted) return;
    startTransitionOpacity.setValue(0.2);
    Animated.timing(startTransitionOpacity, {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [hasSessionStarted, isPlaylistSession, startTransitionOpacity]);

  useEffect(() => {
    return () => {
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
    };
  }, []);

  const revealControlsTemporarily = () => {
    if (!isSoundscapeImmersion) {
      return;
    }

    setAreControlsRevealed(true);
    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
    }
    controlsHideTimeoutRef.current = setTimeout(() => {
      setAreControlsRevealed(false);
    }, 2200);
  };
  const setPlayerVolume = useCallback((player: any, volume: number) => {
    try {
      if (typeof player.setVolume === "function") {
        player.setVolume(volume);
      } else {
        player.volume = volume;
      }
    } catch {}
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
    } catch {}
    try {
      secondaryPlayer.pause();
      secondaryPlayer.seekTo(0);
    } catch {}
    setPlayerVolume(primaryPlayer, 1);
    setPlayerVolume(secondaryPlayer, 0);
    setActivePlayerKey("primary");
  }, [clearFadeOutInterval, primaryPlayer, secondaryPlayer, setPlayerVolume]);

  const pauseAll = useCallback(() => {
    try {
      primaryPlayer.pause();
    } catch {}
    try {
      secondaryPlayer.pause();
    } catch {}
  }, [primaryPlayer, secondaryPlayer]);

  const onTogglePlay = () => {
    try {
      if (activeStatus.playing) {
        pauseAll();
        return;
      }

      if (isPlaylistSession && !hasSessionStarted) {
        resetPlayers();
        setHasSessionStarted(true);
        setAutoPlayNextTrack(true);
        return;
      }

      if (atEnd) activePlayer.seekTo(0);
      activePlayer.play();
      setHasSessionStarted(true);
    } catch {}
  };

  const onRestart = () => {
    try {
      resetPlayers();
      primaryPlayer.play();
      setHasSessionStarted(true);
    } catch {}
  };

  const onSeek = (value: number) => {
    try {
      activePlayer.seekTo(value);
    } catch {}
  };

  const onSeekBarPress = (locationX: number) => {
    if (!duration || !progressWidth) return;
    const ratio = Math.min(Math.max(locationX / progressWidth, 0), 1);
    onSeek(ratio * duration);
  };

  useEffect(() => {
    const stopPlayback = () => {
      resetPlayers();
    };

    const unsubBeforeRemove = navigation.addListener("beforeRemove", (event) => {
      if (isExitingSessionRef.current) {
        return;
      }

      if (!(isPlaylistSession && hasSessionStarted)) {
        stopPlayback();
        return;
      }

      event.preventDefault();
      setIsExitModalVisible(true);
    });
    const unsubBlur = navigation.addListener("blur", stopPlayback);

    return () => {
      unsubBeforeRemove();
      unsubBlur();
      stopPlayback();
    };
  }, [hasSessionStarted, isPlaylistSession, navigation, resetPlayers]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerRight: () => null,
    });
  }, [navigation]);

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
    if (!showSoundscapeControls) return;
    if (!activeStatus.playing) return;
    if (!duration) return;

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
      } catch {}
    }

    const fadeProgress = duration > loopStart ? (current - loopStart) / (duration - loopStart) : 1;
    setPlayerVolume(activePlayer, Math.max(0, 1 - fadeProgress));
    setPlayerVolume(inactivePlayer, Math.min(1, fadeProgress));

    if (atEnd) {
      try {
        activePlayer.pause();
        activePlayer.seekTo(0);
      } catch {}
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
    if (!showSoundscapeControls || !timerSeconds || timerSeconds <= 0) return;
    if (!activeStatus.playing) return;

    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeStatus.playing, showSoundscapeControls, timerSeconds]);

  useEffect(() => {
    if (activeStatus.playing) return;
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
        } catch {}
        try {
          inactivePlayer.seekTo(0);
        } catch {}
        setPlayerVolume(activePlayer, 1);
        setPlayerVolume(inactivePlayer, 0);
      }
    }, 250);
  }, [
    activePlayer,
    clearFadeOutInterval,
    inactivePlayer,
    pauseAll,
    setPlayerVolume,
  ]);

  useEffect(() => {
    if (!showSoundscapeControls) return;
    if (timerRemaining === null) return;
    if (timerRemaining > 0) return;
    fadeOutAndStop();
    setTimerRemaining(timerSeconds);
  }, [fadeOutAndStop, showSoundscapeControls, timerRemaining, timerSeconds]);


  useEffect(() => {
    if (!autoPlayNextTrack) return;
    try {
      primaryPlayer.play();
      setHasSessionStarted(true);
    } catch {
      // no-op
    } finally {
      setAutoPlayNextTrack(false);
    }
  }, [autoPlayNextTrack, primaryPlayer, track.id]);

  useEffect(() => {
    if (!isPlaylistSession || !hasSessionStarted) return;
    if (activeStatus.playing || !atEnd) return;

    if (playlistIndex < normalizedPlaylistIds.length - 1) {
      setPlaylistIndex((prev) => prev + 1);
      setAutoPlayNextTrack(true);
      return;
    }

    resetPlayers();
    setHasSessionStarted(false);
  }, [
    activeStatus.playing,
    atEnd,
    hasSessionStarted,
    isPlaylistSession,
    normalizedPlaylistIds.length,
    playlistIndex,
    resetPlayers,
  ]);

  const handleTimerSelect = (seconds: number) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
  };

  const handleStop = () => {
    resetPlayers();
    setTimerRemaining(timerSeconds);
  };

  const handleConfirmExitSession = () => {
    pauseAll();
    resetPlayers();
    setAutoPlayNextTrack(false);
    setHasSessionStarted(false);
    setPlaylistIndex(0);
    setIsExitModalVisible(false);
    isExitingSessionRef.current = true;
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.xl + insets.bottom }
        ]}
        showsVerticalScrollIndicator={false}
        onTouchStart={revealControlsTemporarily}
      >
        <View style={styles.coverWrap}>
          <View style={styles.coverFrame}>
            <Animated.Image source={track.cover} style={[styles.cover, isPlaylistSession ? { opacity: artworkOpacity } : null]} resizeMode="cover" />
            <Pressable
              style={styles.favoriteButton}
              hitSlop={6}
              onPress={() => setFavorite(toggleFavorite(track.id))}
            >
              <FontAwesome
                name={favorite ? "heart" : "heart-o"}
                size={typography.iconMd}
                color={favorite ? "#FF4D4D" : colors.mutedText}
              />
            </Pressable>
          </View>
        </View>

        {isPlaylistSession ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.phaseToneOverlay, { backgroundColor: phaseToneColor, opacity: phaseToneOpacity }]}
          />
        ) : null}
        {isPlaylistSession ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.startTransitionOverlay, { opacity: startTransitionOpacity }]}
          />
        ) : null}

        <View style={styles.titleRow}>
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>{isPlaylistSession ? sleepSessionTitle : track.title}</Text>
            <Text style={styles.creator}>{isPlaylistSession ? sleepSessionPhase : track.creator}</Text>
          </View>
        </View>

        {showSoundscapeControls ? (
          <View style={styles.soundscapeOptions}>
            <View style={styles.optionBlock}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Timer</Text>
                <View style={styles.infoWrap}>
                  <Pressable
                    onPressIn={() => setShowTimerInfo(true)}
                    onPressOut={() => setShowTimerInfo(false)}
                    style={styles.infoIcon}
                    hitSlop={6}
                  >
                    <Text style={styles.infoIconText}>?</Text>
                  </Pressable>
                  {showTimerInfo ? (
                    <View style={styles.infoBubbleOverlay}>
                      <Text style={styles.infoText}>Audio akan dihentikan sesuai durasi timer.</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {isSessionActive ? (
                <Text style={styles.timerStatusText}>
                  {formatTime(timerRemaining ?? timerSeconds ?? 0)}
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timerRow}
                >
                  {TIMER_OPTIONS.map((option) => (
                    <Pressable
                      key={option.seconds}
                      style={({ pressed }) => [
                        styles.timerPill,
                        timerSeconds === option.seconds && styles.timerPillActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleTimerSelect(option.seconds)}
                    >
                      <Text style={[styles.timerText, timerSeconds === option.seconds && styles.timerTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        ) : null}

        {showSoundscapeControls ? null : isPlaylistSession ? (
          <>
            <View
              style={styles.progressWrap}
              onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
            >
              <View style={isPlaylistSession ? styles.sessionProgressTrack : styles.progressTrack}>
                <View
                  style={[
                    styles.sessionProgressFill,
                    { width: progressWidth ? `${sessionProgressRatio * 100}%` : "0%" }
                  ]}
                />
              </View>
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, styles.sessionTimeText]}>{formatTime(sessionCurrent)}</Text>
              <Text style={[styles.timeText, styles.sessionTimeText]}>{formatTime(sessionDuration)}</Text>
            </View>
          </>
        ) : (
          <>
            <Pressable
              style={styles.progressWrap}
              onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
              onPress={(event) => onSeekBarPress(event.nativeEvent.locationX)}
            >
              <View style={isPlaylistSession ? styles.sessionProgressTrack : styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: progressWidth ? `${progressRatio * 100}%` : "0%" }
                  ]}
                />
                <View style={[styles.progressHandle, { left: progressHandleLeft }]} />
              </View>
            </Pressable>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(current)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </>
        )}


        <Pressable style={styles.controlsTapArea} onPress={revealControlsTemporarily}>
          <View style={[styles.controlsRow, { opacity: controlsOpacity }]}>
          {isSoundscapeImmersion ? null : showSoundscapeControls ? (
            <Pressable onPress={handleStop} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>Stop</Text>
            </Pressable>
          ) : isPlaylistSession ? null : (
            <Pressable onPress={onRestart} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>{id.player.restart}</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onTogglePlay}
            style={({ pressed }) => [
              isPlaylistSession ? styles.primaryBtnSingle : styles.primaryBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryText}>{activeStatus.playing ? id.player.pause : isPlaylistSession ? id.player.sleepSessionStartCta : id.player.start}</Text>
          </Pressable>
          </View>
        </Pressable>
      </ScrollView>

      <SleepSessionExitModal
        visible={isExitModalVisible}
        onCancel={() => setIsExitModalVisible(false)}
        onConfirmExit={handleConfirmExitSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.md,
  },
  coverWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  coverFrame: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: { fontSize: typography.title, color: colors.text, fontWeight: "700" },
  creator: { marginTop: spacing.xs / 4, fontSize: typography.caption, color: colors.mutedText },
  favoriteButton: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing.xs,
    width: controlSizes.favoriteButton,
    height: controlSizes.favoriteButton,
    borderRadius: controlSizes.favoriteButton / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  progressWrap: { marginTop: spacing.xl },
  progressTrack: {
    height: controlSizes.progressHeight,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  progressHandle: {
    position: "absolute",
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: spacing.xs / 2,
    backgroundColor: colors.primary,
    top: "50%",
    transform: [{ translateY: -(spacing.xs / 2) }],
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs / 2,
    marginBottom: spacing.xl,
  },
  timeText: { fontSize: typography.caption, color: colors.mutedText },
  controlsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  soundscapeOptions: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  optionBlock: {
    gap: spacing.xs,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing.xs / 2,
  },
  optionTitle: {
    fontSize: typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  infoWrap: {
    position: "relative",
  },
  infoIcon: {
    width: controlSizes.infoIcon,
    height: controlSizes.infoIcon,
    borderRadius: controlSizes.infoIcon / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.mutedText,
  },
  infoBubbleOverlay: {
    position: "absolute",
    bottom: 24,
    left: -8,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    zIndex: 10,
    minWidth: 180,
  },
  infoText: {
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timerPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  timerPillActive: {
    backgroundColor: colors.primary,
  },
  timerText: {
    fontSize: typography.tiny,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  timerTextActive: {
    color: colors.primaryText,
  },
  timerStatusText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.mutedText,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnSingle: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontSize: typography.caption, fontWeight: "700", textAlign: "center" },

  controlsTapArea: {
    marginTop: spacing.md,
  },
  phaseToneOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  startTransitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.card,
  },
  sessionProgressTrack: {
    height: controlSizes.progressHeight,
    borderRadius: radius.full,
    backgroundColor: `${colors.white}A6`,
    overflow: "hidden",
  },
  sessionProgressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}B3`,
  },
  sessionTimeText: {
    opacity: 0.72,
  },
  pressed: { opacity: 0.85 },
});
