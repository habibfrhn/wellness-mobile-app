import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
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

function formatMinutes(sec: number) {
  const minutes = Math.max(1, Math.round(sec / 60));
  return `${minutes} min`;
}

function formatTag(tag?: string) {
  if (!tag) return "Wellness";
  return tag
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AudioPlayerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { audioId } = route.params;
  const track = useMemo(() => getTrackById(audioId), [audioId]);

  // No autoplay: do not call play() on mount.
  const player = useAudioPlayer(track.asset, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [progressWidth, setProgressWidth] = useState(0);
  const [favorite, setFavorite] = useState(() => isFavorite(track.id));

  useEffect(() => {
    setFavorite(isFavorite(track.id));
  }, [track.id]);

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

  const onSeekBarPress = (locationX: number) => {
    if (!duration || !progressWidth) return;
    const ratio = Math.min(Math.max(locationX / progressWidth, 0), 1);
    onSeek(ratio * duration);
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
    <View
      style={[
        styles.container,
        { paddingBottom: spacing.lg + insets.bottom + BOTTOM_NAV_HEIGHT }
      ]}
    >
      <Image source={track.cover} style={styles.cover} resizeMode="contain" />
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.creator}>{track.creator}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{formatMinutes(duration)}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>{formatTag(track.tags[0])}</Text>
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
  title: { fontSize: 18, color: colors.text, fontWeight: "700", marginTop: spacing.xl },
  creator: { marginTop: 2, fontSize: 12, color: colors.mutedText },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  metaText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: "600",
  },
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
