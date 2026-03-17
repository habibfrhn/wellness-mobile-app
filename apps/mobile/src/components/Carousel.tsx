import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { colors, spacing, radius, typography, lineHeights } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";
import SectionTitle from "./SectionTitle";

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
  columns?: 1 | 2;
};

export default function Carousel({ title, tracks, onPress, columns = 1 }: CarouselProps) {
  return (
    <View style={styles.container}>
      <SectionTitle title={title} />
      <View style={styles.grid}>
        {tracks.map((item) => {
          const isSoundscape = item.contentType === "soundscape";

          return (
            <View key={item.id} style={[styles.item, columns === 2 ? styles.itemTwoColumns : styles.itemSingleColumn]}>
              <Pressable
                onPress={() => onPress(item)}
                style={({ pressed }) => [styles.card, styles.cardShadow, pressed && styles.pressed]}
                hitSlop={6}
              >
                <View style={styles.cardContent}>
                  <Image
                    source={item.thumbnail}
                    style={[
                      styles.thumbnail,
                      { height: columns === 2 ? spacing.xl + spacing.md : spacing.xl * 2 },
                    ]}
                    resizeMode="cover"
                  />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.creator}
                    </Text>
                    {isSoundscape ? null : <Text style={styles.cardDuration}>{formatTime(item.durationSec)}</Text>}
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  item: {
    minWidth: 0,
  },
  itemSingleColumn: {
    width: "100%",
  },
  itemTwoColumns: {
    width: "48%",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    gap: 0,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: "100%",
    borderRadius: radius.md,
  },
  cardTitle: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.text,
    lineHeight: lineHeights.tight,
    marginTop: spacing.xs,
  },
  metaRow: {
    marginTop: spacing.xs / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs / 2,
  },
  cardMeta: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.mutedText,
    marginRight: spacing.xs / 2,
  },
  cardDuration: {
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
