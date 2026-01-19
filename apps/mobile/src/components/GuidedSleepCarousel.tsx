import React from "react";
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from "react-native";
import { colors, spacing, typography } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";
import AudioTrackCard from "./AudioTrackCard";

type GuidedSleepCarouselProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

function chunkTracks(tracks: AudioTrack[], size: number) {
  const pages: AudioTrack[][] = [];
  for (let i = 0; i < tracks.length; i += size) {
    pages.push(tracks.slice(i, i + size));
  }
  return pages;
}

export default function GuidedSleepCarousel({ title, tracks, onPress }: GuidedSleepCarouselProps) {
  const { width } = useWindowDimensions();
  const horizontalPadding = spacing.sm;
  const pageWidth = Math.round((width - horizontalPadding * 2) * 0.75);
  const pages = chunkTracks(tracks, 4);

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={pages}
        keyExtractor={(_, index) => `page-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: pageWidth }]}>
            <View style={styles.row}>
              {item.slice(0, 2).map((track) => (
                <View key={track.id} style={styles.cell}>
                  <AudioTrackCard track={track} onPress={() => onPress(track)} />
                </View>
              ))}
            </View>
            <View style={styles.row}>
              {item.slice(2, 4).map((track) => (
                <View key={track.id} style={styles.cell}>
                  <AudioTrackCard track={track} onPress={() => onPress(track)} />
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  page: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
  },
});
