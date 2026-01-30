import React from "react";
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

type FeaturedAudioCardProps = {
  track: AudioTrack;
  onPress: (track: AudioTrack) => void;
};

export default function FeaturedAudioCard({ track, onPress }: FeaturedAudioCardProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = spacing.sm;
  const cardPadding = spacing.sm;
  const standardCardWidth = Math.max(130, Math.round((width - horizontalPadding * 2 - spacing.sm * 2) / 2.25));
  const thumbnailSize = standardCardWidth - cardPadding * 2;
  const cardWidth = Math.round(width - horizontalPadding * 2);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onPress(track)}
        style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
        hitSlop={6}
      >
        <View style={styles.content}>
          <Image
            source={track.thumbnail}
            style={[styles.thumbnail, { width: thumbnailSize, height: thumbnailSize }]}
            resizeMode="cover"
          />
          <View style={styles.details}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {`${track.title} (${formatTime(track.durationSec)})`}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {track.creator}
              </Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={20} color={colors.mutedText} style={styles.nextIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md + spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignSelf: "center",
    position: "relative",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  thumbnail: {
    borderRadius: radius.md,
  },
  details: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 16,
    textAlign: "left",
  },
  metaRow: {
    marginTop: spacing.xs / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing.xs / 2,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.mutedText,
  },
  nextIcon: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing.xs,
  },
  pressed: { opacity: 0.85 },
});
