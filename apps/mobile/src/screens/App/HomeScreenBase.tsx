import React, { useEffect } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import FeaturedAudioCard from "../../components/FeaturedAudioCard";
import HomeCarouselSection from "../../components/HomeCarouselSection";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeNightSummary from "../../components/HomeNightSummary";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/tokens";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, "Home">;
  centered?: boolean;
};

export default function HomeScreenBase({ navigation, centered = false }: Props) {
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        centered ? styles.centeredContent : null,
        { paddingBottom: spacing.sm + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={centered ? styles.contentWrap : undefined}>
        <HomeGreetingTitle />
        <HomeNightSummary
          onPressPrimary={() => navigation.navigate("NightMode")}
          onPressSecondary={() => {
            // placeholder action
          }}
        />
        {featuredTrack ? (
          <FeaturedAudioCard
            track={featuredTrack}
            onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
          />
        ) : null}
        <AudioTrackListSection
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: spacing.sm,
  },
  centeredContent: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  contentWrap: {
    width: "100%",
    maxWidth: 480,
  },
});
