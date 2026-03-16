import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { AudioTrack } from "../content/audioCatalog";
import { colors, radius, spacing, typography, lineHeights } from "../theme/tokens";
import SectionTitle from "./SectionTitle";

type HomeCarouselSectionProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

function shortenTitle(title: string, maxLength = 22) {
  if (title.length <= maxLength) {
    return title;
  }

  return `${title.slice(0, maxLength - 1)}…`;
}

export default function HomeCarouselSection({ title, tracks, onPress }: HomeCarouselSectionProps) {
  return (
    <View style={styles.container}>
      <SectionTitle title={title} />
      <View style={styles.list}>
        {tracks.map((track) => (
          <Pressable
            key={track.id}
            onPress={() => onPress(track)}
            style={({ pressed }) => [styles.card, styles.cardShadow, pressed && styles.pressed]}
            hitSlop={6}
          >
            <Image source={track.thumbnail} style={styles.thumbnail} resizeMode="contain" />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {shortenTitle(track.title)}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {track.creator}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cardShadow: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  thumbnail: {
    width: 40,
    height: 40,
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
  cardMeta: {
    marginTop: spacing.xs / 2,
    fontSize: typography.micro,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
