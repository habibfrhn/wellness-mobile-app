import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeScreenHeader from "../../components/HomeScreenHeader.web";
import HomeFeedbackSection from "../../components/HomeFeedbackSection.web";
import {
  getWebPageContainerStyle,
  getWebPageTopSpacing,
  getWebSectionSpacing,
  getWebViewport,
  WEB_SECTION_CONTENT_INSET,
} from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { trackEvent } from "../../services/analytics";
import { colors, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const DESKTOP_PAGE_MAX_WIDTH = 1120;
const TABLET_PAGE_MAX_WIDTH = 820;

function blurWebActiveElement() {
  if (typeof document === "undefined") {
    return;
  }

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

export default function HomeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const isDesktopWeb = webViewport === "desktop";
  const isMobileWeb = webViewport === "mobile";
  const sectionGap = getWebSectionSpacing(webViewport);
  const pageContainerStyle = getWebPageContainerStyle(webViewport, {
    mobile: 480,
    tablet: TABLET_PAGE_MAX_WIDTH,
    desktop: DESKTOP_PAGE_MAX_WIDTH,
  });

  const nonSoundscapeTracks = useMemo(
    () => AUDIO_TRACKS.filter((track) => track.contentType !== "soundscape"),
    [],
  );
  const soundscapeTracks = useMemo(
    () => AUDIO_TRACKS.filter((track) => track.contentType === "soundscape"),
    [],
  );

  const openPlayer = (audioTrackId: AppStackParamList["Player"]["audioId"]) => {
    blurWebActiveElement();
    void trackEvent("audio_click", { audio_id: audioTrackId });
    navigation.navigate("Player", { audioId: audioTrackId });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        {
          paddingTop: isMobileWeb
            ? spacing.md
            : getWebPageTopSpacing(webViewport),
          paddingBottom: spacing.xl + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.contentWrap, pageContainerStyle]}>
        <View style={{ marginBottom: sectionGap }}>
          <HomeScreenHeader navigation={navigation} />
        </View>

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
                  onPress={(track) => openPlayer(track.id)}
                />
              </View>
              <View style={styles.desktopColumn}>
                <AudioTrackListSection
                  title={id.home.soundscapeShortTitle}
                  tracks={soundscapeTracks}
                  showDuration={false}
                  onPress={(track) => openPlayer(track.id)}
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.sectionBlock,
                styles.audioSectionsStack,
                { gap: sectionGap },
              ]}
            >
              <AudioTrackListSection
                title={id.home.pickWhatYouNeedTitle}
                tracks={nonSoundscapeTracks}
                onPress={(track) => openPlayer(track.id)}
              />
              <AudioTrackListSection
                title={id.home.soundscapeShortTitle}
                tracks={soundscapeTracks}
                showDuration={false}
                onPress={(track) => openPlayer(track.id)}
              />
            </View>
          )}

          <View style={styles.feedbackSectionWrap}>
            <HomeFeedbackSection />
          </View>
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
    paddingBottom: spacing.sm,
  },
  contentWrap: {
    width: "100%",
    alignSelf: "center",
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
  feedbackSectionWrap: {
    paddingHorizontal: WEB_SECTION_CONTENT_INSET,
  },
});
