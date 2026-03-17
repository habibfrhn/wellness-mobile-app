import React from "react";
import { View, Text, Pressable, StyleSheet, Image, Platform } from "react-native";
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
  showDuration?: boolean;
};

export default function AudioTrackCard({ track, onPress, showDuration = true }: AudioTrackCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.cardShadow, pressed && styles.pressed]}
      hitSlop={6}
    >
      <Image source={track.thumbnail} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {track.title}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {track.creator}
          </Text>
          {showDuration ? <Text style={styles.cardDuration}>{formatTime(track.durationSec)}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    ...(Platform.OS === "web" ? { boxShadow: `0px 4px 12px ${colors.text}14` } : {}),
  },
  thumbnail: {
    width: 48,
    height: 48,
    aspectRatio: 1,
    borderTopLeftRadius: radius.sm,
    borderBottomLeftRadius: radius.sm,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  cardTitle: {
    flexGrow: 1,
    flexShrink: 0,
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
    minWidth: 40,
    fontSize: typography.tiny,
    color: colors.mutedText,
    textAlign: "right",
  },
  pressed: { opacity: 0.85 },
});
