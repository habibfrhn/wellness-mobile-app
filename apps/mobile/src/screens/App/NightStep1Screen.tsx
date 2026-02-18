import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getTrackById } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "NightStep1">;

function getStep1AudioId(mode: "calm_mind" | "release_accept") {
  if (mode === "release_accept") {
    return "menerima-diri" as const;
  }
  return "bersiap-tidur" as const;
}

export default function NightStep1Screen({ navigation, route }: Props) {
  const { mode, stressBefore } = route.params;
  const track = useMemo(() => getTrackById(getStep1AudioId(mode)), [mode]);
  const player = useAudioPlayer(track.asset, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const hasNavigatedRef = useRef(false);

  const title = mode === "calm_mind" ? id.home.nightStep1CalmMindTitle : id.home.nightStep1ReleaseAcceptTitle;

  const duration = status.duration || track.durationSec;
  const current = Math.min(status.currentTime || 0, duration);
  const isAtEnd = duration > 0 && current >= duration - 0.25;

  useEffect(() => {
    try {
      player.play();
    } catch {}

    return () => {
      try {
        player.pause();
        player.seekTo(0);
      } catch {}
    };
  }, [player]);

  useEffect(() => {
    if (!isAtEnd || hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace("NightStep2", { mode, stressBefore });
  }, [isAtEnd, mode, navigation, stressBefore]);

  const handleToggle = () => {
    try {
      if (status.playing) {
        player.pause();
      } else {
        if (isAtEnd) player.seekTo(0);
        player.play();
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>{id.home.nightStep1Header}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{track.title}</Text>

      <Pressable onPress={handleToggle} style={styles.playButton}>
        <Text style={styles.playButtonText}>{status.playing ? id.player.pause : id.player.start}</Text>
      </Pressable>

      <Text style={styles.timeText}>{`${Math.floor(current)} / ${Math.floor(duration)} dtk`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  stepLabel: {
    color: colors.mutedText,
    fontSize: typography.small,
    fontWeight: "600",
  },
  title: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    marginBottom: spacing.xs,
  },
  playButton: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  playButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
  timeText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
});
