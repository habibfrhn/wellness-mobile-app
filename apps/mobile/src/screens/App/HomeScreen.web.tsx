import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import SleepOptionModal from "../../components/SleepOptionModal";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeHeaderLogo from "../../components/HomeHeaderLogo";
import HomeHeaderSettingsButton from "../../components/HomeHeaderSettingsButton";
import HomeNightSummary from "../../components/HomeNightSummary";
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
import { registerNightCompletion } from "../../services/nightStreak";
import { colors, radius, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const DESKTOP_PAGE_MAX_WIDTH = 1120;
const TABLET_PAGE_MAX_WIDTH = 820;

export default function HomeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const isDesktopWeb = webViewport === "desktop";
  const showHeaderRow = webViewport !== "mobile";
  const sectionGap = getWebSectionSpacing(webViewport);

  const completionPayload = useMemo(() => {
    if (!route.params || route.params.completed !== true) {
      return null;
    }

    return route.params;
  }, [route.params]);

  useEffect(() => {
    let mounted = true;

    const syncNightCompletion = async () => {
      if (!completionPayload) {
        return;
      }

      await registerNightCompletion();

      if (!mounted) {
        return;
      }

      navigation.setParams(undefined);
    };

    void syncNightCompletion();

    return () => {
      mounted = false;
    };
  }, [completionPayload, navigation]);

  const nonSoundscapeTracks = AUDIO_TRACKS.filter((track) => track.contentType !== "soundscape");
  const soundscapeTracks = AUDIO_TRACKS.filter((track) => track.contentType === "soundscape");
  const [isSleepOptionModalVisible, setIsSleepOptionModalVisible] = useState(false);

  const handleSelectSleepOption = (option: "calm_mind" | "release_accept") => {
    setIsSleepOptionModalVisible(false);

    const playlistIds =
      option === "calm_mind"
        ? (["afirmasi_tidur", "bersiap_tidur", "rintik-hujan"] as const)
        : (["meditasi_tidur", "bersiap_tidur", "ombak-laut"] as const);

    navigation.navigate("Player", { audioId: playlistIds[0], playlistIds: [...playlistIds], sleepMode: option });
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
        {showHeaderRow ? (
          <View style={[styles.headerRow, !isDesktopWeb && styles.headerRowCompact, { marginBottom: sectionGap }]}>
            <HomeHeaderLogo />
            <HomeHeaderSettingsButton navigation={navigation} />
          </View>
        ) : null}

        <View style={[styles.sectionStack, { gap: sectionGap }]}>
          <View style={styles.sectionBlock}>
            <HomeGreetingTitle />
            <View style={[styles.primaryActionCardWrap, { marginTop: sectionGap }]}>
              <View style={styles.primaryActionCard}>
                <HomeNightSummary onPressPrimary={() => setIsSleepOptionModalVisible(true)} />
              </View>
            </View>
          </View>

          {isDesktopWeb ? (
            <View style={[styles.sectionBlock, styles.desktopTwoColumnSection]}>
              <View style={styles.desktopColumn}>
                <AudioTrackListSection
                  title={id.home.pickWhatYouNeedTitle}
                  tracks={nonSoundscapeTracks}
                  onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
                />
              </View>
              <View style={styles.desktopColumn}>
                <AudioTrackListSection
                  title={id.home.soundscapeShortTitle}
                  tracks={soundscapeTracks}
                  showDuration={false}
                  onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
                />
              </View>
            </View>
          ) : (
            <View style={[styles.sectionBlock, styles.audioSectionsStack, { gap: sectionGap }]}>
              <AudioTrackListSection
                title={id.home.pickWhatYouNeedTitle}
                tracks={nonSoundscapeTracks}
                onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
              />
              <AudioTrackListSection
                title={id.home.soundscapeShortTitle}
                tracks={soundscapeTracks}
                showDuration={false}
                onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
              />
            </View>
          )}
        </View>
      </View>

      <SleepOptionModal
        visible={isSleepOptionModalVisible}
        onClose={() => setIsSleepOptionModalVisible(false)}
        onSelect={handleSelectSleepOption}
      />
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
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: WEB_SECTION_CONTENT_INSET,
  },
  headerRowCompact: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
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
  primaryActionCardWrap: {
    paddingHorizontal: WEB_SECTION_CONTENT_INSET,
  },
  primaryActionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
});
