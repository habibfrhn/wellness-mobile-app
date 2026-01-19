import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";

import { colors, radius, spacing, typography } from "../../theme/tokens";
import { BOTTOM_NAV_HEIGHT } from "../../navigation/BottomNav";

const breathingModes = [
  { key: "calm", label: "Tenangkan diri", inhale: 4, hold: 7, exhale: 8 },
  { key: "sleep", label: "Persiapan tidur", inhale: 4, hold: 4, exhale: 4, postHold: 4 },
] as const;

const durations = [1, 3, 5, 10];

const audioByDuration: Record<number, number> = {
  1: require("../../../assets/audio/breathing/01-breathing-1min.m4a"),
  3: require("../../../assets/audio/breathing/02-breathing-3min.m4a"),
  5: require("../../../assets/audio/breathing/03-breathing-5min.m4a"),
  10: require("../../../assets/audio/breathing/04-breathing-10min.m4a"),
};

type Phase = "inhale" | "hold" | "exhale" | "postHold";

const phaseLabels: Record<Phase, string> = {
  inhale: "Tarik napas",
  hold: "Tahan napas",
  exhale: "Buang napas",
  postHold: "Tahan napas",
};

const basePhaseOrder: Phase[] = ["inhale", "hold", "exhale"];

const formatTimer = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function BreathingPlayerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedMode, setSelectedMode] = useState<(typeof breathingModes)[number]["key"]>("calm");
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseCount, setPhaseCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pulseScale = useRef(new Animated.Value(1)).current;

  const currentMode = useMemo(
    () => breathingModes.find((mode) => mode.key === selectedMode) ?? breathingModes[0],
    [selectedMode]
  );
  const phaseOrder = useMemo(() => {
    return currentMode.postHold ? [...basePhaseOrder, "postHold"] : basePhaseOrder;
  }, [currentMode.postHold]);

  const activePhaseDuration = phase === "postHold" ? currentMode.postHold ?? 0 : currentMode[phase];
  const audioAsset = audioByDuration[selectedDuration];
  const player = useAudioPlayer(audioAsset);
  const sessionTotalSeconds = selectedDuration * 60;

  const startSession = () => {
    setIsRunning(true);
    setIsPaused(false);
    setPhase("inhale");
    setPhaseCount(0);
    setElapsedSeconds(0);
    if (audioEnabled) {
      try {
        player.seekTo(0);
        player.play();
      } catch {}
    }
  };

  useEffect(() => {
    if (!isRunning) {
      pulseScale.stopAnimation();
      pulseScale.setValue(1);
      return;
    }
    if (isPaused) {
      pulseScale.stopAnimation();
      return;
    }

    const inhaleScale = 1.15;
    pulseScale.stopAnimation();

    if (phase === "hold" || phase === "postHold") {
      pulseScale.setValue(phase === "hold" ? inhaleScale : 1);
      return;
    }

    Animated.timing(pulseScale, {
      toValue: phase === "inhale" ? inhaleScale : 1,
      duration: activePhaseDuration * 1000,
      useNativeDriver: true,
    }).start();
  }, [activePhaseDuration, isPaused, isRunning, phase, pulseScale]);

  useEffect(() => {
    if (!isCountingDown) return;

    const timer = setTimeout(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setIsCountingDown(false);
          startSession();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isCountingDown, countdownSeconds]);

  useEffect(() => {
    if (!isRunning || isCountingDown || isPaused) return;
    if (elapsedSeconds >= sessionTotalSeconds) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setElapsedSeconds((prev) => prev + 1);
      setPhaseCount((prev) => {
        if (prev + 1 >= activePhaseDuration) {
          setPhase((current) => phaseOrder[(phaseOrder.indexOf(current) + 1) % phaseOrder.length]);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [activePhaseDuration, elapsedSeconds, isPaused, isRunning, phaseOrder, sessionTotalSeconds]);

  useEffect(() => {
    if (!isRunning || isCountingDown || isPaused || !audioEnabled) return;
    try {
      player.play();
    } catch {}
  }, [audioEnabled, isCountingDown, isPaused, isRunning, player, selectedDuration]);

  useEffect(() => {
    if (audioEnabled) return;
    try {
      player.pause();
      player.seekTo(0);
    } catch {}
  }, [audioEnabled, player]);

  useEffect(() => {
    if (!isRunning) {
      try {
        player.pause();
        player.seekTo(0);
      } catch {}
      return;
    }
    if (isPaused) {
      try {
        player.pause();
      } catch {}
      return;
    }
    if (audioEnabled) {
      try {
        player.play();
      } catch {}
    }
  }, [audioEnabled, isPaused, isRunning, player]);

  useEffect(() => {
    if (!isRunning && !isCountingDown && !isPaused) return;
    setIsRunning(false);
    setIsCountingDown(false);
    setIsPaused(false);
    setCountdownSeconds(3);
    setPhase("inhale");
    setPhaseCount(0);
    setElapsedSeconds(0);
  }, [selectedDuration, selectedMode]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
        player.seekTo(0);
      } catch {}
    };
  }, [player]);

  const stopSession = useCallback(() => {
    setIsRunning(false);
    setIsCountingDown(false);
    setIsPaused(false);
    setCountdownSeconds(3);
    setElapsedSeconds(0);
    setPhase("inhale");
    setPhaseCount(0);
    try {
      player.pause();
      player.seekTo(0);
    } catch {}
  }, [player]);

  useEffect(() => {
    const unsubBeforeRemove = navigation.addListener("beforeRemove", () => {
      stopSession();
    });
    const unsubBlur = navigation.addListener("blur", () => {
      stopSession();
    });
    return () => {
      unsubBeforeRemove();
      unsubBlur();
      stopSession();
    };
  }, [navigation, stopSession]);

  const handleStartStop = () => {
    if (isRunning || isCountingDown || isPaused) {
      stopSession();
      return;
    }
    setIsCountingDown(true);
    setCountdownSeconds(3);
  };

  const handlePauseResume = () => {
    if (!isRunning || isCountingDown) return;
    setIsPaused((prev) => !prev);
  };

  const handleAudioToggle = () => {
    if (isLocked) return;
    setAudioEnabled((prev) => !prev);
  };

  const displayPhaseLabel = isCountingDown
    ? "Mulai"
    : isPaused
      ? "Jeda"
      : isRunning
        ? phaseLabels[phase]
        : "Pilih dan mulai";
  const displayCount = isCountingDown ? countdownSeconds : isRunning ? phaseCount + 1 : null;
  const isLocked = isRunning || isCountingDown || isPaused;
  const durationLabel = formatTimer(sessionTotalSeconds);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingBottom: spacing.lg + insets.bottom + BOTTOM_NAV_HEIGHT }
        ]}
      >
      <View style={styles.pulseWrap}>
        <View style={styles.pulseStack}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseScale }] }]} />
          <View style={styles.pulseInner}>
            <Text style={styles.phaseLabel}>{displayPhaseLabel}</Text>
            {displayCount !== null ? <Text style={styles.phaseCount}>{displayCount}</Text> : null}
          </View>
        </View>
      </View>
      <Text style={styles.timerText}>{durationLabel}</Text>

      <Text style={styles.sectionTitle}>Pilih pola napas</Text>
      <View style={styles.cardRow}>
        {breathingModes.map((mode) => {
          const active = selectedMode === mode.key;
          return (
            <Pressable
              key={mode.key}
              style={({ pressed }) => [
                styles.modeCard,
                active && styles.modeCardActive,
                isLocked && styles.optionLocked,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedMode(mode.key)}
              disabled={isLocked}
            >
              <Text style={[styles.modeTitle, active && styles.modeTitleActive]}>{mode.label}</Text>
              <Text style={[styles.modeSubtitle, active && styles.modeSubtitleActive]}>
                {mode.inhale}-{mode.hold}-{mode.exhale}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Durasi</Text>
      <View style={styles.durationRow}>
        {durations.map((duration) => {
          const active = selectedDuration === duration;
          return (
            <Pressable
              key={duration}
              style={({ pressed }) => [
                styles.durationPill,
                active && styles.durationPillActive,
                isLocked && styles.optionLocked,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedDuration(duration)}
              disabled={isLocked}
            >
              <Text style={[styles.durationText, active && styles.durationTextActive]}>{duration} min</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.audioRow, isLocked && styles.optionLocked]} pointerEvents={isLocked ? "none" : "auto"}>
        <View>
          <Text style={styles.audioTitle}>Audio panduan</Text>
          <Text style={styles.audioSubtitle}>
            {audioEnabled ? "Audio aktif sesuai durasi." : "Audio dimatikan."}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.audioToggle,
            audioEnabled && styles.audioToggleActive,
            pressed && styles.pressed,
          ]}
          onPress={handleAudioToggle}
        >
          <Text style={[styles.audioToggleText, audioEnabled && styles.audioToggleTextActive]}>
            {audioEnabled ? "On" : "Off"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.controlsRow}>
        {isRunning || isCountingDown || isPaused ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={handleStartStop}
            >
              <Text style={styles.secondaryText}>Stop</Text>
            </Pressable>
            {isRunning && !isCountingDown ? (
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={handlePauseResume}
              >
                <Text style={styles.primaryText}>{isPaused ? "Lanjut" : "Jeda"}</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={handleStartStop}>
            <Text style={styles.primaryText}>Mulai</Text>
          </Pressable>
        )}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  pulseWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  timerText: {
    textAlign: "center",
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  pulseStack: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseOuter: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
  },
  pulseInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  phaseLabel: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  phaseCount: {
    fontSize: 36,
    color: colors.primary,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  cardRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeCardActive: {
    borderColor: colors.primary,
  },
  modeTitle: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  modeTitleActive: {
    color: colors.primary,
  },
  modeSubtitle: {
    marginTop: spacing.xs / 2,
    fontSize: 12,
    color: colors.mutedText,
  },
  modeSubtitleActive: {
    color: colors.primary,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  durationPill: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  durationPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  durationTextActive: {
    color: colors.primaryText,
  },
  optionLocked: {
    opacity: 0.5,
  },
  audioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  audioTitle: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  audioSubtitle: {
    marginTop: spacing.xs / 2,
    fontSize: 12,
    color: colors.mutedText,
  },
  audioToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  audioToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  audioToggleText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "700",
  },
  audioToggleTextActive: {
    color: colors.primaryText,
  },
  controlsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
  },
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
  pressed: {
    opacity: 0.85,
  },
});
