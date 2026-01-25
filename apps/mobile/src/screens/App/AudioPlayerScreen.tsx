import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BOTTOM_NAV_HEIGHT } from "../../navigation/BottomNav";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { getTrackById, isFavorite, toggleFavorite } from "../../content/audioCatalog";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const CROSSFADE_SECONDS = 10;
const FADE_OUT_SECONDS = 5;
const TIMER_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
  { label: "1 h", seconds: 60 * 60 },
];

export default function AudioPlayerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { audioId } = route.params;
  const track = useMemo(() => getTrackById(audioId), [audioId]);
  const isSoundscape = track.contentType === "soundscape";

  // No autoplay: do not call play() on mount.
  const primaryPlayer = useAudioPlayer(track.asset, { updateInterval: 250 });
  const secondaryPlayer = useAudioPlayer(track.asset, { updateInterval: 250 });
  const primaryStatus = useAudioPlayerStatus(primaryPlayer);
  const secondaryStatus = useAudioPlayerStatus(secondaryPlayer);
  const [progressWidth, setProgressWidth] = useState(0);
  const [favorite, setFavorite] = useState(() => isFavorite(track.id));
  const [activePlayerKey, setActivePlayerKey] = useState<"primary" | "secondary">("primary");
  const [loopEnabled, setLoopEnabled] = useState(isSoundscape);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [showLoopInfo, setShowLoopInfo] = useState(false);
  const [showTimerInfo, setShowTimerInfo] = useState(false);
  const crossfadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeOutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFavorite(isFavorite(track.id));
  }, [track.id]);

  const activePlayer = activePlayerKey === "primary" ? primaryPlayer : secondaryPlayer;
  const inactivePlayer = activePlayerKey === "primary" ? secondaryPlayer : primaryPlayer;
  const activeStatus = activePlayerKey === "primary" ? primaryStatus : secondaryStatus;
  const duration = activeStatus.duration || track.durationSec;
  const current = Math.min(activeStatus.currentTime || 0, duration);
  const atEnd = duration > 0 && current >= duration - 0.25;
  const isSessionActive = isSoundscape && (activeStatus.playing || current > 0);

  const setPlayerVolume = useCallback((player: any, volume: number) => {
    try {
      if (typeof player.setVolume === "function") {
        player.setVolume(volume);
      } else {
        player.volume = volume;
      }
    } catch {}
  }, []);

  const clearCrossfadeInterval = useCallback(() => {
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
  }, []);

  const clearFadeOutInterval = useCallback(() => {
    if (fadeOutIntervalRef.current) {
      clearInterval(fadeOutIntervalRef.current);
      fadeOutIntervalRef.current = null;
    }
  }, []);

  const resetPlayers = useCallback(() => {
    clearCrossfadeInterval();
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
  }, [clearCrossfadeInterval, clearFadeOutInterval, primaryPlayer, secondaryPlayer, setPlayerVolume]);

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
      if (atEnd) activePlayer.seekTo(0);
      activePlayer.play();
    } catch {}
  };

  const onRestart = () => {
    try {
      resetPlayers();
      primaryPlayer.play();
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

    const unsubBeforeRemove = navigation.addListener("beforeRemove", stopPlayback);
    const unsubBlur = navigation.addListener("blur", stopPlayback);

    return () => {
      unsubBeforeRemove();
      unsubBlur();
      stopPlayback();
    };
  }, [navigation, resetPlayers]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerRight: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    setLoopEnabled(isSoundscape);
    setTimerSeconds(null);
    setTimerRemaining(null);
    resetPlayers();
  }, [isSoundscape, resetPlayers, track.id]);

  useEffect(() => {
    if (!isSoundscape) {
      setLoopEnabled(false);
      setTimerSeconds(null);
      setTimerRemaining(null);
      resetPlayers();
    }
  }, [isSoundscape, resetPlayers]);

  useEffect(() => {
    if (!loopEnabled || !isSoundscape || !activeStatus.playing) return;
    if (duration <= 0) return;
    if (crossfadeIntervalRef.current) return;

    const remaining = duration - current;
    if (remaining > CROSSFADE_SECONDS) return;

    try {
      setPlayerVolume(inactivePlayer, 0);
      inactivePlayer.seekTo(0);
      inactivePlayer.play();
    } catch {}

    const start = Date.now();
    const fadeDurationMs = CROSSFADE_SECONDS * 1000;
    crossfadeIntervalRef.current = setInterval(() => {
      const progress = Math.min((Date.now() - start) / fadeDurationMs, 1);
      setPlayerVolume(activePlayer, 1 - progress);
      setPlayerVolume(inactivePlayer, progress);
      if (progress >= 1) {
        clearCrossfadeInterval();
        try {
          activePlayer.pause();
          activePlayer.seekTo(0);
        } catch {}
        setPlayerVolume(activePlayer, 1);
        setActivePlayerKey((prev) => (prev === "primary" ? "secondary" : "primary"));
      }
    }, 250);
  }, [
    activePlayer,
    activeStatus.playing,
    clearCrossfadeInterval,
    current,
    duration,
    inactivePlayer,
    isSoundscape,
    loopEnabled,
    setPlayerVolume,
  ]);

  useEffect(() => {
    if (!isSoundscape || !timerSeconds || timerSeconds <= 0) return;
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
  }, [activeStatus.playing, isSoundscape, timerSeconds]);

  useEffect(() => {
    if (activeStatus.playing) return;
    clearCrossfadeInterval();
    clearFadeOutInterval();
  }, [activeStatus.playing, clearCrossfadeInterval, clearFadeOutInterval]);

  const fadeOutAndStop = useCallback(() => {
    clearCrossfadeInterval();
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
    clearCrossfadeInterval,
    clearFadeOutInterval,
    inactivePlayer,
    pauseAll,
    setPlayerVolume,
  ]);

  useEffect(() => {
    if (!isSoundscape) return;
    if (timerRemaining === null) return;
    if (timerRemaining > 0) return;
    fadeOutAndStop();
    setTimerSeconds(null);
    setTimerRemaining(null);
  }, [fadeOutAndStop, isSoundscape, timerRemaining]);

  const handleTimerSelect = (seconds: number | null) => {
    setTimerSeconds(seconds);
    setTimerRemaining(seconds);
  };

  const handleStop = () => {
    resetPlayers();
    setTimerRemaining(timerSeconds);
  };

  const handleLoopToggle = () => {
    setLoopEnabled((prev) => {
      const next = !prev;
      if (!next) {
        clearCrossfadeInterval();
        try {
          inactivePlayer.pause();
          inactivePlayer.seekTo(0);
        } catch {}
        setPlayerVolume(inactivePlayer, 0);
      }
      return next;
    });
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: spacing.xl + insets.bottom + BOTTOM_NAV_HEIGHT }
      ]}
    >
      <Image source={track.cover} style={styles.cover} resizeMode="contain" />
      <View style={styles.titleRow}>
        <View style={styles.titleTextWrap}>
          <Text style={styles.title}>{track.title}</Text>
          <Text style={styles.creator}>{track.creator}</Text>
        </View>
        <Pressable
          style={styles.favoriteButton}
          hitSlop={6}
          onPress={() => setFavorite(toggleFavorite(track.id))}
        >
          <Text style={[styles.favoriteText, favorite && styles.favoriteActive]}>
            {favorite ? "♥" : "♡"}
          </Text>
        </Pressable>
      </View>

      {isSoundscape ? (
        <View style={styles.soundscapeOptions}>
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>Loop</Text>
              <Pressable
                onPressIn={() => setShowLoopInfo(true)}
                onPressOut={() => setShowLoopInfo(false)}
                style={styles.infoIcon}
                hitSlop={6}
              >
                <Text style={styles.infoIconText}>?</Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.togglePill,
                loopEnabled && styles.togglePillActive,
                isSessionActive && styles.controlDisabled,
                pressed && styles.pressed,
              ]}
              onPress={handleLoopToggle}
              disabled={isSessionActive}
            >
              <Text style={[styles.toggleText, loopEnabled && styles.toggleTextActive]}>
                {loopEnabled ? "On" : "Off"}
              </Text>
            </Pressable>
          </View>
          {showLoopInfo ? (
            <View style={styles.infoBubble}>
              <Text style={styles.infoText}>Audio akan diulang.</Text>
            </View>
          ) : null}
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>Timer</Text>
              <Pressable
                onPressIn={() => setShowTimerInfo(true)}
                onPressOut={() => setShowTimerInfo(false)}
                style={styles.infoIcon}
                hitSlop={6}
              >
                <Text style={styles.infoIconText}>?</Text>
              </Pressable>
            </View>
            {isSessionActive ? (
              <Text style={styles.timerStatusText}>
                {timerSeconds ? formatTime(timerRemaining ?? timerSeconds) : "Audio akan selalu diulang"}
              </Text>
            ) : (
              <View style={styles.timerRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.timerPill,
                    timerSeconds === null && styles.timerPillActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleTimerSelect(null)}
                >
                  <Text style={[styles.timerText, timerSeconds === null && styles.timerTextActive]}>Off</Text>
                </Pressable>
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
              </View>
            )}
          </View>
          {showTimerInfo ? (
            <View style={styles.infoBubble}>
              <Text style={styles.infoText}>Audio akan dihentikan sesuai durasi timer.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {isSoundscape ? null : (
        <>
          <Pressable
            style={styles.progressWrap}
            onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
            onPress={(event) => onSeekBarPress(event.nativeEvent.locationX)}
          >
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: duration > 0 && progressWidth ? `${(current / duration) * 100}%` : "0%" }
                ]}
              />
            </View>
          </Pressable>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(current)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </>
      )}

      <View style={styles.controlsRow}>
        {isSoundscape ? (
          <Pressable onPress={handleStop} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Stop</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onRestart} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>{id.player.restart}</Text>
          </Pressable>
        )}

        <Pressable onPress={onTogglePlay} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{activeStatus.playing ? id.player.pause : id.player.start}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.bg },
  cover: {
    width: "70%",
    maxWidth: 320,
    maxHeight: 320,
    aspectRatio: 1,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    alignSelf: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: { fontSize: 18, color: colors.text, fontWeight: "700" },
  creator: { marginTop: 2, fontSize: 12, color: colors.mutedText },
  favoriteButton: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteText: {
    fontSize: 20,
    color: colors.mutedText,
    lineHeight: 22,
  },
  favoriteActive: {
    color: colors.primary,
  },
  progressWrap: { marginTop: spacing.xl },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs / 2,
    marginBottom: spacing.xl,
  },
  timeText: { fontSize: 12, color: colors.mutedText },
  controlsRow: { flexDirection: "row", gap: spacing.sm, marginTop: 0 },
  soundscapeOptions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  optionTitle: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  infoBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  infoText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  togglePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  togglePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  toggleTextActive: {
    color: colors.primaryText,
  },
  controlDisabled: {
    opacity: 0.6,
  },
  timerRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    gap: spacing.xs / 2,
  },
  timerPill: {
    flexBasis: 0,
    flexGrow: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timerPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timerText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  timerTextActive: {
    color: colors.primaryText,
  },
  timerStatusText: {
    fontSize: 12,
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
  primaryText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.secondaryText, fontSize: typography.body, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.85 },
});
