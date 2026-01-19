import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../theme/tokens";
import { AUDIO_TRACKS } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import Carousel from "../../components/Carousel";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const Header = (
    <View>
      <Carousel
        title="Temani tidur"
        tracks={AUDIO_TRACKS.slice(0, 6)}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
      <Carousel
        title="Tidur dengan panduan"
        tracks={AUDIO_TRACKS.filter((track) => track.tags.includes("sleep-guide"))}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
      <Carousel
        title="Suara pengantar tidur"
        tracks={AUDIO_TRACKS.filter((track) => track.tags.includes("soundscape"))}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
    </View>
  );

  const Footer = (
    <View style={{ paddingTop: spacing.md, paddingBottom: spacing.md }}>
      <Text style={styles.note}>{id.home.noteNoAutoplay}</Text>
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
      {Footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.sm,
    backgroundColor: colors.bg,
  },

  note: { fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },

});
