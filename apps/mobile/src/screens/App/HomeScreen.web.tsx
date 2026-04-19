import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import SleepOptionModal from "../../components/SleepOptionModal";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeScreenHeader from "../../components/HomeScreenHeader.web";
import HomeNightSummary from "../../components/HomeNightSummary";
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
import {
  deriveNightStreakHeroState,
  getNightStreakState,
  type NightStreakHeroState,
} from "../../services/nightStreak";
import { trackEvent } from "../../services/analytics";
import { colors, radius, spacing } from "../../theme/tokens";

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
  const [streakState, setStreakState] = useState<NightStreakHeroState>({
    kind: "no_streak",
  });
  const pageContainerStyle = getWebPageContainerStyle(webViewport, {
    mobile: 480,
    tablet: TABLET_PAGE_MAX_WIDTH,
    desktop: DESKTOP_PAGE_MAX_WIDTH,
  });

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

      const progress = await getNightStreakState(true);

      if (!mounted) {
        return;
      }

      if (progress) {
        setStreakState(deriveNightStreakHeroState(progress));
      }
      navigation.setParams(undefined);
    };

    void syncNightCompletion();

    return () => {
      mounted = false;
    };
  }, [completionPayload, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const refreshStreak = async () => {
        const progress = await getNightStreakState(true);
        if (!cancelled) {
          setStreakState(deriveNightStreakHeroState(progress));
        }
      };

      void refreshStreak();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  const nonSoundscapeTracks = useMemo(
    () => AUDIO_TRACKS.filter((track) => track.contentType !== "soundscape"),
    [],
  );
  const soundscapeTracks = useMemo(
    () => AUDIO_TRACKS.filter((track) => track.contentType === "soundscape"),
    [],
  );
  const [isSleepOptionModalVisible, setIsSleepOptionModalVisible] =
    useState(false);

  const openPlayer = (audioTrackId: AppStackParamList["Player"]["audioId"]) => {
    blurWebActiveElement();
    void trackEvent("audio_click", { audio_id: audioTrackId });
    navigation.navigate("Player", { audioId: audioTrackId });
  };

  const handleSelectSleepOption = (option: "calm_mind" | "release_accept") => {
    setIsSleepOptionModalVisible(false);
    blurWebActiveElement();
    void trackEvent("tailored_session_select", { session_mode: option });

    const playlistIds =
      option === "calm_mind"
        ? (["terima_diri", "persiapan_tidur", "rintik-hujan"] as const)
        : (["syukuri_hari", "persiapan_tidur", "ombak-laut"] as const);

    navigation.navigate("Player", {
      audioId: playlistIds[0],
      playlistIds: [...playlistIds],
      sleepMode: option,
    });
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
            <View
              style={[styles.primaryActionCardWrap, { marginTop: sectionGap }]}
            >
              <View style={styles.primaryActionCard}>
                <HomeNightSummary
                  onPressPrimary={() => {
                    void trackEvent("home_sleep_cta_click");
                    setIsSleepOptionModalVisible(true);
                  }}
                  streakState={streakState}
                />
              </View>
              <View style={styles.feedbackSectionWrap}>
                <HomeFeedbackSection />
              </View>
            </View>
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
  primaryActionCardWrap: {
    paddingHorizontal: WEB_SECTION_CONTENT_INSET,
  },
  primaryActionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 0,
    paddingVertical: 0,
    boxShadow: "0px 2px 10px rgba(33,50,94,0.10)",
  },
  feedbackSectionWrap: {
    marginTop: spacing.md,
    boxShadow: "0px 2px 10px rgba(33,50,94,0.10)",
    borderRadius: radius.md,
  },
});
