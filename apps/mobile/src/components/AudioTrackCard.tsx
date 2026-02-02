import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { colors, spacing, radius, typography, lineHeights } from "../theme/tokens";
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

function shortenTitle(title: string, maxLength = 15) {
  if (title.length <= maxLength) {
    return title;
  }

  return `${title.slice(0, maxLength - 1)}…`;
}

export default function AudioTrackCard({ track, onPress }: AudioTrackCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      hitSlop={6}
    >
      <Image source={track.thumbnail} style={styles.thumbnail} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{shortenTitle(track.title)}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {track.creator}
          </Text>
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
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.text,
    lineHeight: lineHeights.tight,
  },
  cardMetaRow: {
    marginTop: spacing.xs / 2,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardMeta: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  cardDuration: {
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
