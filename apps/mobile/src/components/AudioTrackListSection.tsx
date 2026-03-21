import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "../theme/tokens";
import { WEB_SECTION_CONTENT_INSET } from "../constants/webLayout";
import type { AudioTrack } from "../content/audioCatalog";
import SectionTitle from "./SectionTitle";
import AudioTrackCard from "./AudioTrackCard";

type AudioTrackListSectionProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
  columns?: 1 | 2;
  showDuration?: boolean;
};

export default function AudioTrackListSection({
  title,
  tracks,
  onPress,
  columns = 1,
  showDuration = true,
}: AudioTrackListSectionProps) {
  return (
    <View style={styles.container}>
      <SectionTitle title={title} />
      <View style={styles.list}>
        {tracks.map((track) => (
          <View
            key={track.id}
            style={[styles.item, columns === 2 ? styles.itemDesktopTwoColumn : styles.itemSingleColumn]}
          >
            <AudioTrackCard track={track} onPress={() => onPress(track)} showDuration={showDuration} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 0,
  },
  list: {
    paddingHorizontal: WEB_SECTION_CONTENT_INSET,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  item: {
    minWidth: 0,
  },
  itemSingleColumn: {
    width: "100%",
  },
  itemDesktopTwoColumn: {
    width: "48%",
  },
});
