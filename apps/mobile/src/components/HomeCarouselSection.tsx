import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import type { AudioTrack } from "../content/audioCatalog";
import useViewportWidth from "../hooks/useViewportWidth";
import { colors, radius, spacing, typography, lineHeights } from "../theme/tokens";
import SectionTitle from "./SectionTitle";

type HomeCarouselSectionProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

const WEB_BREAKPOINT = 640;
const MOBILE_VISIBLE_CARDS = 1.35;

function shortenTitle(title: string, maxLength = 24) {
  if (title.length <= maxLength) {
    return title;
  }

  return `${title.slice(0, maxLength - 1)}…`;
}

export default function HomeCarouselSection({ title, tracks, onPress }: HomeCarouselSectionProps) {
  const viewportWidth = useViewportWidth();
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const isDesktopLike = viewportWidth > WEB_BREAKPOINT;

  const effectiveWidth = containerWidth ?? Math.max(320, viewportWidth - spacing.sm * 2);

  const cardWidth = useMemo(() => {
    if (isDesktopLike) {
      return Math.max(180, Math.floor((effectiveWidth - spacing.sm * 2) / 3));
    }

    return Math.max(200, Math.floor((effectiveWidth - spacing.sm) / MOBILE_VISIBLE_CARDS));
  }, [effectiveWidth, isDesktopLike]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <SectionTitle title={title} />
      <View style={styles.listWrap} onLayout={onContainerLayout}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {tracks.map((track) => (
            <Pressable
              key={track.id}
              onPress={() => onPress(track)}
              style={({ pressed }) => [styles.card, styles.cardShadow, { width: cardWidth }, pressed && styles.pressed]}
              hitSlop={6}
            >
              <View style={styles.imageWrap}>
                <Image source={track.thumbnail} style={styles.thumbnail} resizeMode="contain" />
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {shortenTitle(track.title)}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {track.creator}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  listWrap: {
    width: "100%",
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrap: {
    width: "100%",
    height: 128,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: radius.sm,
  },
  cardTitle: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.text,
    lineHeight: lineHeights.tight,
  },
  cardMeta: {
    marginTop: spacing.xs / 2,
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
