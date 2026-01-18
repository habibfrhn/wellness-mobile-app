import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

type AudioTrackCardProps = {
  track: AudioTrack;
  onPress: () => void;
};

export default function AudioTrackCard({ track, onPress }: AudioTrackCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      hitSlop={6}
    >
      <Image source={track.thumbnail} style={styles.thumbnail} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{track.title}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>{track.creator}</Text>
          <Text style={styles.cardDuration}>{formatTime(track.durationSec)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.xs,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  cardMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardMeta: {
    fontSize: typography.small,
    color: colors.mutedText,
  },
  cardDuration: {
    fontSize: typography.small,
    color: colors.secondaryText,
    fontWeight: "600",
  },
  pressed: { opacity: 0.85 },
});
