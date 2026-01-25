import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

type CarouselProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

function shortenTitle(title: string, maxLength = 15) {
  if (title.length <= maxLength) {
    return title;
  }

  return `${title.slice(0, maxLength - 1)}…`;
}

export default function Carousel({ title, tracks, onPress }: CarouselProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = 0;
  const cardWidth = Math.max(130, Math.round((width - horizontalPadding * 2 - spacing.sm * 2) / 2.25));
  const thumbnailHeight = Math.round(cardWidth * 0.72);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
            hitSlop={6}
          >
            <View style={styles.cardContent}>
              <Image
                source={item.thumbnail}
                style={[styles.thumbnail, { height: thumbnailHeight }]}
                resizeMode="cover"
              />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {shortenTitle(item.title)}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.creator}
                </Text>
                {item.contentType === "soundscape" ? null : (
                  <Text style={styles.cardDuration}>{formatTime(item.durationSec)}</Text>
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingTop: spacing.xs / 2,
    paddingBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.xs,
    justifyContent: "flex-start",
  },
  cardContent: {
    gap: spacing.xs / 2,
  },
  thumbnail: {
    width: "100%",
    borderRadius: radius.sm,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 16,
  },
  metaRow: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs / 2,
  },
  cardMeta: {
    flex: 1,
    fontSize: 11,
    color: colors.mutedText,
    marginRight: spacing.xs / 2,
  },
  cardDuration: {
    fontSize: 11,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
