import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getTrackById } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "NightStep3">;

type BackgroundTrackId = "lapisan-sunyi" | "dibawah-hujan" | "larut-perlahan";

const BACKGROUND_TRACK_IDS: BackgroundTrackId[] = ["lapisan-sunyi", "dibawah-hujan", "larut-perlahan"];

export default function NightStep3Screen({ navigation, route }: Props) {
  const { mode, stressBefore } = route.params;
  const [selectedTrackId, setSelectedTrackId] = useState<BackgroundTrackId>("lapisan-sunyi");

  const selectedTrack = useMemo(() => getTrackById(selectedTrackId), [selectedTrackId]);
  const player = useAudioPlayer(selectedTrack.asset, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const duration = status.duration || selectedTrack.durationSec;
  const current = Math.min(status.currentTime || 0, duration);
  const isAtEnd = duration > 0 && current >= duration - 0.25;

  useEffect(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch {}

    return () => {
      try {
        player.pause();
        player.seekTo(0);
      } catch {}
    };
  }, [player, selectedTrackId]);

  useEffect(() => {
    if (!isAtEnd) return;
    try {
      player.seekTo(0);
      player.play();
    } catch {}
  }, [isAtEnd, player]);

  const handleContinue = () => {
    navigation.navigate("NightCheckOut", { mode, stressBefore });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepLabel}>{id.home.nightStep3Header}</Text>
      <Text style={styles.title}>{selectedTrack.title}</Text>

      <View style={styles.trackList}>
        {BACKGROUND_TRACK_IDS.map((trackId) => {
          const track = getTrackById(trackId);
          const selected = trackId === selectedTrackId;
          return (
            <Pressable
              key={trackId}
              onPress={() => setSelectedTrackId(trackId)}
              style={[styles.trackButton, selected ? styles.trackButtonSelected : null]}
            >
              <Text style={[styles.trackText, selected ? styles.trackTextSelected : null]}>{track.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={handleContinue} style={styles.continueButton}>
        <Text style={styles.continueText}>{id.home.nightStep3ContinueCta}</Text>
      </Pressable>
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
    marginBottom: spacing.xs,
  },
  trackList: {
    gap: spacing.xs,
  },
  trackButton: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trackButtonSelected: {
    backgroundColor: colors.primary,
  },
  trackText: {
    color: colors.text,
    fontSize: typography.small,
  },
  trackTextSelected: {
    color: colors.primaryText,
  },
  continueButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  continueText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
});
