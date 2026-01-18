import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../theme/tokens";
import { AUDIO_TRACKS, type AudioTrack } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import AudioTrackCard from "../../components/AudioTrackCard";
import SleepAidCarousel from "../../components/SleepAidCarousel";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const Header = (
    <View>
      <SleepAidCarousel
        title="Bantu tidur"
        tracks={AUDIO_TRACKS.slice(0, 6)}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
    </View>
  );

  const Footer = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
      <Text style={styles.note}>{id.home.noteNoAutoplay}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: AudioTrack }) => (
    <AudioTrackCard
      track={item}
      onPress={() => navigation.navigate("Player", { audioId: item.id })}
    />
  );

  return (
    <FlatList
      data={AUDIO_TRACKS}
      keyExtractor={(t) => t.id}
      renderItem={renderItem}
      ListHeaderComponent={Header}
      ListFooterComponent={Footer}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: spacing.lg + insets.bottom } // critical for Android nav bar overlap
      ]}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },

  note: { fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },

});
