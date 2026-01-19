import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";

import { colors, radius, spacing, typography } from "../../theme/tokens";

const breathingModes = [
  { key: "calm", label: "Tenangkan diri", inhale: 4, hold: 7, exhale: 8 },
  { key: "sleep", label: "Persiapan tidur", inhale: 4, hold: 4, exhale: 4 },
] as const;

const durations = [1, 3, 5, 10];

const audioByDuration: Record<number, number> = {
  1: require("../../../assets/audio/breathing/01-breathing-1min.m4a"),
  3: require("../../../assets/audio/breathing/02-breathing-3min.m4a"),
  5: require("../../../assets/audio/breathing/03-breathing-5min.m4a"),
  10: require("../../../assets/audio/breathing/04-breathing-10min.m4a"),
};

type Phase = "inhale" | "hold" | "exhale";

const phaseLabels: Record<Phase, string> = {
  inhale: "Tarik napas",
  hold: "Tahan napas",
  exhale: "Buang napas",
};

const phaseOrder: Phase[] = ["inhale", "hold", "exhale"];

export default function BreathingPlayerScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMode, setSelectedMode] = useState<(typeof breathingModes)[number]["key"]>("calm");
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseCount, setPhaseCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pulseScale = useRef(new Animated.Value(1)).current;

  const totalSeconds = selectedDuration * 60;
  const currentMode = useMemo(
    () => breathingModes.find((mode) => mode.key === selectedMode) ?? breathingModes[0],
    [selectedMode]
  );
  const activePhaseDuration = currentMode[phase];
  const audioAsset = audioByDuration[selectedDuration];
  const player = useAudioPlayer(audioAsset);

  useEffect(() => {
    if (!isRunning) {
      pulseScale.stopAnimation();
      pulseScale.setValue(1);
      return;
    }

    const inhaleScale = 1.15;
    pulseScale.stopAnimation();

    if (phase === "hold") {
      pulseScale.setValue(inhaleScale);
      return;
    }

    Animated.timing(pulseScale, {
      toValue: phase === "inhale" ? inhaleScale : 1,
      duration: activePhaseDuration * 1000,
      useNativeDriver: true,
    }).start();
  }, [activePhaseDuration, isRunning, phase, pulseScale]);

  useEffect(() => {
    if (!isCountingDown) return;

    const timer = setTimeout(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          setIsCountingDown(false);
          setIsRunning(true);
          setPhase("inhale");
          setPhaseCount(0);
          setElapsedSeconds(0);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isCountingDown]);

  useEffect(() => {
    if (!isRunning || isCountingDown) return;
    if (elapsedSeconds >= totalSeconds) {
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
  }, [activePhaseDuration, elapsedSeconds, isRunning, totalSeconds]);

  useEffect(() => {
    if (!isRunning || isCountingDown || !audioEnabled) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  }, [audioEnabled, isCountingDown, isRunning, player, selectedDuration]);

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
    }
  }, [isRunning, player]);

  useEffect(() => {
    if (!isRunning && !isCountingDown) return;
    setIsRunning(false);
    setIsCountingDown(false);
    setCountdownSeconds(3);
    setPhase("inhale");
    setPhaseCount(0);
    setElapsedSeconds(0);
  }, [isCountingDown, isRunning, selectedDuration, selectedMode]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
      setIsCountingDown(false);
      setCountdownSeconds(3);
      setElapsedSeconds(0);
      setPhase("inhale");
      setPhaseCount(0);
    } else {
      setIsCountingDown(true);
      setCountdownSeconds(3);
    }
  };

  const displayPhaseLabel = isCountingDown
    ? "Mulai"
    : isRunning
      ? phaseLabels[phase]
      : "Pilih dan mulai";
  const displayCount = isCountingDown ? countdownSeconds : isRunning ? phaseCount + 1 : "-";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.lg + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pulseWrap}>
        <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseScale }] }]}>
          <View style={styles.pulseInner}>
            <Text style={styles.phaseLabel}>{displayPhaseLabel}</Text>
            <Text style={styles.phaseCount}>{displayCount}</Text>
          </View>
        </Animated.View>
      </View>

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
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedMode(mode.key)}
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
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedDuration(duration)}
            >
              <Text style={[styles.durationText, active && styles.durationTextActive]}>{duration} min</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.audioRow}>
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
          onPress={() => setAudioEnabled((prev) => !prev)}
        >
          <Text style={[styles.audioToggleText, audioEnabled && styles.audioToggleTextActive]}>
            {audioEnabled ? "On" : "Off"}
          </Text>
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={handleStartStop}>
        <Text style={styles.primaryText}>{isRunning ? "Stop" : "Mulai"}</Text>
      </Pressable>
    </ScrollView>
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
    paddingVertical: spacing.md,
  },
  pulseOuter: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
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
    backgroundColor: colors.secondary,
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
  primaryBtn: {
    marginTop: spacing.sm,
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
  pressed: {
    opacity: 0.85,
  },
});
