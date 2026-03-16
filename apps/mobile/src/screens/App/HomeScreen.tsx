import React, { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AUDIO_TRACKS } from "../../content/audioCatalog";
import AudioTrackListSection from "../../components/AudioTrackListSection";
import HomeGreetingTitle from "../../components/HomeGreetingTitle";
import HomeHeaderLogo from "../../components/HomeHeaderLogo";
import HomeHeaderSettingsButton from "../../components/HomeHeaderSettingsButton";
import HomeNightSummary, { type HomeStartOption } from "../../components/HomeNightSummary";
import useViewportWidth from "../../hooks/useViewportWidth";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { getNightStreakState, registerNightCompletion } from "../../services/nightStreak";
import { colors, radius, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const WEB_BREAKPOINT = 640;
const DESKTOP_PAGE_MAX_WIDTH = 1100;

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


  const nonSoundscapeTracks = AUDIO_TRACKS.filter((track) => track.contentType !== "soundscape");
  const soundscapeTracks = AUDIO_TRACKS.filter((track) => track.contentType === "soundscape");

  const handlePrimaryStart = (option: HomeStartOption) => {
    if (option === "calm_mind") {
      navigation.navigate("NightCheckIn", { mode: "calm_mind" });
      return;
    }

    if (option === "soundscape") {
      navigation.navigate("Player", { audioId: "lapisan-sunyi" });
      return;
    }

    navigation.navigate("Player", { audioId: "bersiap-tidur" });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.listContent,
        isDesktopWeb ? styles.desktopListContent : styles.mobileListContent,
        { paddingBottom: spacing.sm + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.contentWrap, isDesktopWeb ? styles.contentWrapDesktop : styles.contentWrapMobile]}>
        {isDesktopWeb ? (
          <View style={styles.desktopHeaderRow}>
            <HomeHeaderLogo />
            <HomeHeaderSettingsButton navigation={navigation} />
          </View>
        ) : null}

        <View style={styles.sectionStack}>
          <View style={styles.sectionBlock}>
            <HomeGreetingTitle />
            <View style={styles.primaryActionCardWrap}>
              <View style={styles.primaryActionCard}>
                <HomeNightSummary
                  streakCount={streakCount}
                  lastNightStressDelta={lastNightStressDelta}
                  onPressPrimary={(option) => handlePrimaryStart(option)}
                />
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
            <View style={styles.sectionBlock}>
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
  },
  mobileListContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  desktopListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg * 0.8,
  },
  contentWrap: {
    width: "100%",
    alignSelf: "center",
  },
  contentWrapMobile: {
    maxWidth: 480,
  },
  contentWrapDesktop: {
    maxWidth: DESKTOP_PAGE_MAX_WIDTH,
  },
  desktopHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    marginTop: 0,
  },
  sectionStack: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionBlock: {
    width: "100%",
  },
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
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  primaryActionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
});
