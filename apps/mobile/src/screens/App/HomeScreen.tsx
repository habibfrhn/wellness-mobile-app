import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../theme/tokens";
import { AUDIO_TRACKS } from "../../content/audioCatalog";
import FeaturedAudioCard from "../../components/FeaturedAudioCard";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeCarouselSection from "../../components/HomeCarouselSection";
import ScreenGradientBackground from "../../components/ScreenGradientBackground";
import { id } from "../../i18n/strings";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const coverUris = Array.from(
      new Set(
        AUDIO_TRACKS.map((track) => Image.resolveAssetSource(track.cover)?.uri).filter(
          (uri): uri is string => Boolean(uri)
        )
      )
    );

    coverUris.forEach((uri) => {
      Image.prefetch(uri);
    });
  }, []);

  const guidedSleepTracks = AUDIO_TRACKS.filter((track) => track.contentType === "guided-sleep");
  const featuredTrack = guidedSleepTracks[0];
  const afirmasiTracks = AUDIO_TRACKS.filter((track) => track.contentType === "afirmasi");

  const Header = (
    <View>
      <HomeGreetingTitle />
      {featuredTrack ? (
        <FeaturedAudioCard
          track={featuredTrack}
          onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
        />
      ) : null}
      <HomeCarouselSection
        title={id.home.afirmasiCarouselTitle}
        tracks={afirmasiTracks}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
      <HomeCarouselSection
        title={id.home.soundscapeCarouselTitle}
        tracks={AUDIO_TRACKS.filter((track) => track.contentType === "soundscape")}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
    </View>
  );

  return (
    <ScreenGradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: spacing.sm + insets.bottom } // critical for Android nav bar overlap
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Header}
      </ScrollView>
    </ScreenGradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: spacing.sm,
  },
});
