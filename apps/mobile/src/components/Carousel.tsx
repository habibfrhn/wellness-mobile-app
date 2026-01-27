import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  variant?: "standard" | "featured";
};

function shortenTitle(title: string, maxLength = 15) {
  if (title.length <= maxLength) {
    return title;
  }

  return `${title.slice(0, maxLength - 1)}…`;
}

export default function Carousel({ title, tracks, onPress, variant = "standard" }: CarouselProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = spacing.sm;
  const isFeatured = variant === "featured";
  const cardPadding = spacing.sm;
  const standardCardWidth = Math.max(130, Math.round((width - horizontalPadding * 2 - spacing.sm * 2) / 2.25));
  const cardWidth = isFeatured ? Math.round(width - horizontalPadding * 2) : standardCardWidth;
  const thumbnailSize = standardCardWidth - cardPadding * 2;

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
        renderItem={({ item }) => {
          const isSoundscape = item.contentType === "soundscape";

          return (
            <Pressable
              onPress={() => onPress(item)}
              style={({ pressed }) => [
                isFeatured ? styles.featuredCard : styles.card,
                { width: cardWidth },
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              {isFeatured ? (
                <>
                  <View style={styles.featuredContent}>
                    <Image
                      source={item.thumbnail}
                      style={[styles.featuredThumbnail, { width: thumbnailSize, height: thumbnailSize }]}
                      resizeMode="cover"
                    />
                    <View style={styles.featuredDetails}>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.featuredMeta} numberOfLines={1}>
                        {item.creator}
                      </Text>
                      {isSoundscape ? null : (
                        <Text style={styles.featuredDuration}>{formatTime(item.durationSec)}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.playButton}>
                    <MaterialCommunityIcons name="play" size={16} color={colors.primaryText} />
                  </View>
                </>
              ) : (
                <View style={styles.cardContent}>
                  <Image
                    source={item.thumbnail}
                    style={[styles.thumbnail, styles.soundscapeThumbnail, { height: thumbnailSize }]}
                    resizeMode="cover"
                  />
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {shortenTitle(item.title)}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.creator}
                    </Text>
                    {isSoundscape ? null : <Text style={styles.cardDuration}>{formatTime(item.durationSec)}</Text>}
                  </View>
                </View>
              )}
            </Pressable>
          );
        }}
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
    paddingLeft: spacing.sm,
  },
  listContent: {
    paddingTop: spacing.xs / 2,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  cardContent: {
    gap: spacing.xs / 2,
    alignItems: "flex-start",
  },
  featuredCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    position: "relative",
  },
  featuredContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  featuredThumbnail: {
    borderRadius: radius.md,
  },
  featuredDetails: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  featuredTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 16,
  },
  featuredMeta: {
    fontSize: 11,
    color: colors.mutedText,
  },
  featuredDuration: {
    fontSize: 11,
    color: colors.mutedText,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  thumbnail: {
    width: "100%",
    borderRadius: radius.md,
  },
  soundscapeThumbnail: {
    width: "100%",
    borderRadius: radius.md,
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
