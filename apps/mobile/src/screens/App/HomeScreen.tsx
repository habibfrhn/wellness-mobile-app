import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeHeaderLogo from "../../components/HomeHeaderLogo";
import HomeHeaderSettingsButton from "../../components/HomeHeaderSettingsButton";
import {
  getWebPageContainerStyle,
  getWebPageTopSpacing,
  getWebSectionSpacing,
  getWebViewport,
} from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { trackEvent } from "../../services/analytics";
import { colors, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const DESKTOP_PAGE_MAX_WIDTH = 1120;
const TABLET_PAGE_MAX_WIDTH = 820;

export default function HomeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const isDesktopWeb = Platform.OS === "web" && webViewport === "desktop";
  const sectionGap = getWebSectionSpacing(webViewport);
  const nonSoundscapeTracks = useMemo(
    () => AUDIO_TRACKS.filter((track) => track.contentType !== "soundscape"),
    [],
  );
  const soundscapeTracks = useMemo(
    () => AUDIO_TRACKS.filter((track) => track.contentType === "soundscape"),
    [],
  );



  const handleAudioPress = (audioId: AppStackParamList["Player"]["audioId"]) => {
    void trackEvent("audio_click", { audio_id: audioId });
    navigation.navigate("Player", { audioId });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingTop: getWebPageTopSpacing(webViewport),
          paddingBottom: spacing.sm + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.contentWrap,
          getWebPageContainerStyle(webViewport, {
            mobile: 480,
            tablet: TABLET_PAGE_MAX_WIDTH,
            desktop: DESKTOP_PAGE_MAX_WIDTH,
          }),
        ]}
      >
        {isDesktopWeb ? (
          <View style={[styles.desktopHeaderRow, { marginBottom: sectionGap }]}>
            <HomeHeaderLogo />
            <HomeHeaderSettingsButton navigation={navigation} />
          </View>
        ) : null}

        <View style={[styles.sectionStack, { gap: sectionGap }]}>
          <View style={styles.sectionBlock}>
            <HomeGreetingTitle />
          </View>

          {isDesktopWeb ? (
            <View style={[styles.sectionBlock, styles.desktopTwoColumnSection]}>
              <View style={styles.desktopColumn}>
                <AudioTrackListSection
                  title={id.home.pickWhatYouNeedTitle}
                  tracks={nonSoundscapeTracks}
                  onPress={(track) => handleAudioPress(track.id)}
                />
              </View>
              <View style={styles.desktopColumn}>
                <AudioTrackListSection
                  title={id.home.soundscapeShortTitle}
                  tracks={soundscapeTracks}
                  showDuration={false}
                  onPress={(track) => handleAudioPress(track.id)}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.sectionBlock, styles.audioSectionsStack, { gap: sectionGap }]}>
              <AudioTrackListSection
                title={id.home.pickWhatYouNeedTitle}
                tracks={nonSoundscapeTracks}
                onPress={(track) => handleAudioPress(track.id)}
              />
              <AudioTrackListSection
                title={id.home.soundscapeShortTitle}
                tracks={soundscapeTracks}
                showDuration={false}
                onPress={(track) => handleAudioPress(track.id)}
              />
            </View>
          )}
        </View>
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
    paddingTop: spacing.sm,
  },
  contentWrap: {
    width: "100%",
    alignSelf: "center",
  },
  desktopHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
    marginTop: 0,
  },
  sectionStack: {},
  sectionBlock: {
    width: "100%",
  },
  audioSectionsStack: {},
  desktopTwoColumnSection: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  desktopColumn: {
    flex: 1,
    minWidth: 0,
  },
});
