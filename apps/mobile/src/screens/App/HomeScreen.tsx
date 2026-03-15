import React, { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import FeaturedAudioCard from "../../components/FeaturedAudioCard";
import HomeCarouselSection from "../../components/HomeCarouselSection";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeNightSummary from "../../components/HomeNightSummary";
import useViewportWidth from "../../hooks/useViewportWidth";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { getNightStreakState, registerNightCompletion } from "../../services/nightStreak";
import { colors, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const WEB_BREAKPOINT = 640;

export default function HomeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [streakCount, setStreakCount] = useState(0);
  const [lastNightStressDelta, setLastNightStressDelta] = useState<number | null>(null);
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && viewportWidth > WEB_BREAKPOINT;

  const completionPayload = useMemo(() => {
    if (!route.params || route.params.completed !== true) {
      return null;
    }

    return route.params;
  }, [route.params]);

  useEffect(() => {
    let mounted = true;

    const syncNightSummary = async () => {
      if (completionPayload) {
        const next = await registerNightCompletion();

        if (!mounted) {
          return;
        }

        setStreakCount(next.streakCount);
        setLastNightStressDelta(completionPayload.stressBefore - completionPayload.stressAfter);

        navigation.setParams(undefined);
        return;
      }

      const saved = await getNightStreakState();
      if (!mounted) {
        return;
      }

      setStreakCount(saved.streakCount);
    };

    syncNightSummary();

    return () => {
      mounted = false;
    };
  }, [completionPayload, navigation]);

  const guidedSleepTracks = AUDIO_TRACKS.filter((track) => track.contentType === "guided-sleep");
  const featuredTrack = guidedSleepTracks[0];
  const afirmasiTracks = AUDIO_TRACKS.filter((track) => track.contentType === "afirmasi");
  const soundscapeTracks = AUDIO_TRACKS.filter((track) => track.contentType === "soundscape");

  const content = (
    <ScrollView
      style={[styles.container, isDesktopWeb && styles.containerDesktop]}
      contentContainerStyle={[
        styles.listContent,
        isDesktopWeb ? styles.desktopListContent : styles.mobileListContent,
        { paddingBottom: spacing.sm + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.contentWrap, isDesktopWeb ? styles.contentWrapDesktop : styles.contentWrapMobile]}>
        {isDesktopWeb ? (
          <View style={styles.desktopTopRow}>
            <View style={styles.desktopSummaryColumn}>
              <HomeGreetingTitle />
              <HomeNightSummary
                streakCount={streakCount}
                lastNightStressDelta={lastNightStressDelta}
                onPressPrimary={() => navigation.navigate("NightMode")}
                onPressSecondary={() => {
                  // placeholder action
                }}
              />
            </View>

            {featuredTrack ? (
              <View style={styles.desktopFeaturedColumn}>
                <FeaturedAudioCard
                  track={featuredTrack}
                  onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <>
            <HomeGreetingTitle />
            <HomeNightSummary
              streakCount={streakCount}
              lastNightStressDelta={lastNightStressDelta}
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
          </>
        )}

        {isDesktopWeb ? (
          <View style={styles.desktopBottomRow}>
            <View style={styles.desktopBottomColumn}>
              <AudioTrackListSection
                title={id.home.afirmasiCarouselTitle}
                tracks={afirmasiTracks}
                onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
              />
            </View>

            <View style={styles.desktopBottomColumn}>
              <HomeCarouselSection
                title={id.home.soundscapeCarouselTitle}
                tracks={soundscapeTracks}
                onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
              />
            </View>
          </View>
        ) : (
          <>
            <AudioTrackListSection
              title={id.home.afirmasiCarouselTitle}
              tracks={afirmasiTracks}
              onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
            />
            <HomeCarouselSection
              title={id.home.soundscapeCarouselTitle}
              tracks={soundscapeTracks}
              onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
            />
          </>
        )}
      </View>
    </ScrollView>
  );

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  containerDesktop: {
    backgroundColor: colors.white,
  },
  listContent: {
    paddingTop: 0,
  },
  mobileListContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  desktopListContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  contentWrap: {
    width: "100%",
    alignSelf: "center",
    gap: spacing.md,
  },
  contentWrapMobile: {
    maxWidth: 480,
  },
  contentWrapDesktop: {
    maxWidth: "100%",
  },
  desktopTopRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  desktopSummaryColumn: {
    flex: 1,
    minWidth: 0,
  },
  desktopFeaturedColumn: {
    flex: 1,
    minWidth: 0,
  },
  desktopBottomRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  desktopBottomColumn: {
    flex: 1,
    minWidth: 0,
  },
});
