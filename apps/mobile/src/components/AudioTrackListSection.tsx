import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";
import SectionTitle from "./SectionTitle";
import AudioTrackCard from "./AudioTrackCard";

type AudioTrackListSectionProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

export default function AudioTrackListSection({ title, tracks, onPress }: AudioTrackListSectionProps) {
  return (
    <View style={styles.container}>
      <SectionTitle title={title} />
      <View style={styles.list}>
        {tracks.map((track, index) => {
          const isLast = index === tracks.length - 1;
          return (
            <View key={track.id} style={isLast && styles.lastCard}>
              <AudioTrackCard track={track} onPress={() => onPress(track)} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  list: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  lastCard: {
    paddingBottom: spacing.sm,
  },
});
