import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/tokens";
import { AUDIO_TRACKS } from "../../content/audioCatalog";
import type { AudioTrack } from "../../content/audioCatalog";
import Carousel from "../../components/Carousel";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const shuffleTracks = (tracks: AudioTrack[]) => {
  const next = [...tracks];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const pickRandomTracks = (tracks: AudioTrack[], count: number) => {
  const pool = [...tracks];
  const picks: AudioTrack[] = [];
  while (pool.length > 0 && picks.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [track] = pool.splice(index, 1);
    if (track) picks.push(track);
  }
  return picks;
};

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const recommendedTracks = useMemo(() => {
    const sleepGuideTracks = AUDIO_TRACKS.filter((track) => track.tags.includes("sleep-guide"));
    const soundscapeTracks = AUDIO_TRACKS.filter((track) => track.tags.includes("soundscape"));
    return shuffleTracks([
      ...pickRandomTracks(sleepGuideTracks, 2),
      ...pickRandomTracks(soundscapeTracks, 2),
    ]);
  }, []);

  const Header = (
    <View>
      <Carousel
        title="Rekomendasi"
        tracks={recommendedTracks}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
      <Carousel
        title="Tidur dengan panduan"
        tracks={AUDIO_TRACKS.filter((track) => track.tags.includes("sleep-guide"))}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
      <Carousel
        title="Soundscape untuk tidur"
        tracks={AUDIO_TRACKS.filter((track) => track.tags.includes("soundscape"))}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: spacing.sm + insets.bottom } // critical for Android nav bar overlap
      ]}
      showsVerticalScrollIndicator={false}
    >
      {Header}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.sm,
    backgroundColor: colors.bg,
  },

});
