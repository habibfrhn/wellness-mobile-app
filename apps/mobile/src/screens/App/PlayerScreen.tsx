import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { getTrackById } from "../../content/audioCatalog";
import CalmPulse from "../../components/CalmPulse";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

export default function PlayerScreen({ route, navigation }: Props) {
  const { audioId } = route.params;
  const track = useMemo(() => getTrackById(audioId), [audioId]);

  // No autoplay: do not call play() on mount.
  const player = useAudioPlayer(track.asset, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const duration = status.duration || track.durationSec;
  const current = Math.min(status.currentTime || 0, duration);
  const atEnd = duration > 0 && current >= duration - 0.25;

  const onTogglePlay = () => {
    try {
      if (status.playing) {
        player.pause();
        return;
      }
      if (atEnd) player.seekTo(0);
      player.play();
    } catch {}
  };

  const onRestart = () => {
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  };

  const onSeek = (value: number) => {
    try {
      player.seekTo(value);
    } catch {}
  };

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", () => {
      try {
        player.pause();
      } catch {}
    });

    return () => {
      unsub();
      try {
        player.pause();
      } catch {}
    };
  }, [navigation, player]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerRight: () => null,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.artWrap}>
        <CalmPulse isActive={!!status.playing} />
        <View style={styles.centerDot} />
      </View>

      <Image source={track.thumbnail} style={styles.thumbnail} />
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.creator}>{track.creator}</Text>

      <View style={styles.progressWrap}>
        <Slider
          minimumValue={0}
          maximumValue={duration}
          value={current}
          onSlidingComplete={onSeek}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>

      <View style={styles.controlsRow}>
        <Pressable onPress={onRestart} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{id.player.restart}</Text>
        </Pressable>

        <Pressable onPress={onTogglePlay} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>{status.playing ? id.player.pause : id.player.start}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700", marginTop: spacing.md },
  creator: { marginTop: spacing.xs / 2, fontSize: typography.small, color: colors.mutedText },
  artWrap: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  centerDot: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 96,
    height: 96,
    borderRadius: radius.sm,
    marginTop: spacing.md,
  },
  progressWrap: { marginTop: spacing.md },
  controlsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: colors.bg, fontSize: typography.body, fontWeight: "700" },
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
