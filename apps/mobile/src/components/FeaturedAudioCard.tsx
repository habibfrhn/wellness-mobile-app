import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { colors, spacing, radius, typography, lineHeights } from "../theme/tokens";
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
  const { width: viewportWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const horizontalPadding = spacing.sm;
  const cardPadding = spacing.sm;
  const measuredWidth = containerWidth ?? viewportWidth - horizontalPadding * 2;
  const cardWidth = Math.max(240, Math.round(measuredWidth - horizontalPadding * 2));
  const thumbnailSize = Math.max(96, Math.min(180, cardWidth - cardPadding * 2));

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
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
    borderRadius: radius.md,
    padding: spacing.sm,
    alignSelf: "stretch",
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
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.text,
    lineHeight: lineHeights.tight,
    textAlign: "center",
  },
  metaRow: {
    marginTop: spacing.xs / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs / 2,
  },
  cardMeta: {
    fontSize: typography.caption,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
