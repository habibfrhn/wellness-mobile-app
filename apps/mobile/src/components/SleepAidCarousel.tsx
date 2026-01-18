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

type SleepAidCarouselProps = {
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

function shortenTitle(title: string, maxLength = 15) {
  if (title.length <= maxLength) {
    return title;
  }

  return `${title.slice(0, maxLength - 1)}…`;
}

export default function SleepAidCarousel({ tracks, onPress }: SleepAidCarouselProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = spacing.md;
  const cardWidth = Math.max(130, Math.round((width - horizontalPadding * 2 - spacing.sm * 2) / 2.25));

  return (
    <View>
      <Text style={styles.title}>Bantu tidur</Text>
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
            <Image source={item.thumbnail} style={styles.thumbnail} resizeMode="cover" />
            <Text style={styles.cardTitle} numberOfLines={2}>
              {shortenTitle(item.title)}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.creator}
              </Text>
              <Text style={styles.cardDuration}>{formatTime(item.durationSec)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  listContent: {
    paddingBottom: spacing.xs,
    paddingRight: spacing.md,
  },
  card: {
    minHeight: 210,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    justifyContent: "flex-start",
  },
  thumbnail: {
    width: "100%",
    height: 120,
    borderRadius: radius.sm,
    marginBottom: spacing.xs / 2,
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
