import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlayerArtworkSection from "../../components/player/PlayerArtworkSection";
import NormalAudioControls from "../../components/player/NormalAudioControls";
import PlayerProgressSection from "../../components/player/PlayerProgressSection";
import SoundscapeControls from "../../components/player/SoundscapeControls";
import SleepSessionProgressHeader from "../../components/player/SleepSessionProgressHeader";
import SoundscapeTimerSection from "../../components/player/SoundscapeTimerSection";
import { isFavorite, toggleFavorite } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import HeaderCloseButton from "../../components/navigation/HeaderCloseButton";
import type { AppStackParamList } from "../../navigation/types";
import { colors, spacing } from "../../theme/tokens";
import {
  getWebPageContainerStyle,
  getWebSectionSpacing,
  getWebViewport,
} from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import {
  TIMER_OPTIONS,
  useAudioPlayerSession,
} from "../../hooks/useAudioPlayerSession";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

export default function AudioPlayerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { audioId, playlistIds } = route.params;
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const isWeb = Platform.OS === "web";
  const playerContentWidth = isWeb ? 320 : 420;
  const sectionGap = isWeb ? getWebSectionSpacing(webViewport) : spacing.md;
  const [progressWidth, setProgressWidth] = useState(0);
  const [favorite, setFavorite] = useState(() => isFavorite(audioId));

  const {
    track,
    activeStatus,
    duration,
    current,
    progressRatio,
    showSoundscapeControls,
    isSessionActive,
    timerSeconds,
    timerRemaining,
    onTogglePlay,
    onRestart,
    onSeek,
    handleTimerSelect,
    handleStop,
    resetSessionState,
    playbackError,
  } = useAudioPlayerSession({ audioId, playlistIds });

  useEffect(() => {
    setFavorite(isFavorite(track.id));
  }, [track.id]);

  const playbackMode = useMemo(() => {
    if (track.contentType === "soundscape") {
      return "soundscape" as const;
    }
    return "normal_audio" as const;
  }, [track.contentType]);

  const onSeekBarPress = useCallback(
    (locationX: number) => {
      if (!duration || !progressWidth) {
        return;
      }
      const ratio = Math.min(Math.max(locationX / progressWidth, 0), 1);
      onSeek(ratio * duration);
    },
    [duration, onSeek, progressWidth],
  );

  const handleClose = useCallback(() => {
    resetSessionState();
    navigation.goBack();
  }, [navigation, resetSessionState]);

  useEffect(() => {
    const stopPlayback = () => {
      resetSessionState();
    };

    const removeBeforeRemoveListener = navigation.addListener(
      "beforeRemove",
      (event) => {
        stopPlayback();
      },
    );
    const removeBlurListener = navigation.addListener("blur", stopPlayback);

    return () => {
      removeBeforeRemoveListener();
      removeBlurListener();
    };
  }, [navigation, resetSessionState]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerStyle: { backgroundColor: colors.white },
      headerShadowVisible: false,
      headerRight: () => null,
      headerLeft: () => <HeaderCloseButton onPress={handleClose} />,
    });
  }, [handleClose, navigation]);



  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          getWebPageContainerStyle(webViewport, {
            mobile: 520,
            tablet: 760,
            desktop: 1120,
          }),
          styles.contentVerticalPadding,
          isWeb && styles.contentVerticalPaddingWeb,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.playerLayout, { gap: sectionGap }]}>
          <View
            style={[styles.artworkColumn, { maxWidth: playerContentWidth }]}
          >
            <PlayerArtworkSection
              cover={track.cover}
              isFavorite={favorite}
              onToggleFavorite={() => setFavorite(toggleFavorite(track.id))}
              compact={isWeb}
            />
          </View>

          <View
            style={[
              styles.sectionsAlignedWithArtwork,
              { maxWidth: playerContentWidth },
            ]}
          >
            <SleepSessionProgressHeader
              title={track.title}
              subtitle={track.creator}
              compact={isWeb}
            />

            {showSoundscapeControls ? (
              <SoundscapeTimerSection
                timerOptions={TIMER_OPTIONS}
                timerSeconds={timerSeconds}
                timerRemaining={timerRemaining}
                isSessionActive={isSessionActive}
                onSelectTimer={handleTimerSelect}
                compact={isWeb}
              />
            ) : (
              <PlayerProgressSection
                current={current}
                duration={duration}
                progressRatio={progressRatio}
                onLayoutWidth={setProgressWidth}
                onSeek={onSeekBarPress}
                progressWidth={progressWidth}
                compact={isWeb}
              />
            )}

            {playbackMode === "soundscape" ? (
              <SoundscapeControls
                isPlaying={activeStatus.playing}
                onStop={handleStop}
                onTogglePlay={onTogglePlay}
                compact={isWeb}
              />
            ) : (
              <NormalAudioControls
                isPlaying={activeStatus.playing}
                onRestart={onRestart}
                onTogglePlay={onTogglePlay}
                compact={isWeb}
              />
            )}

            {playbackError ? (
              <Text style={styles.errorText}>{id.player.playbackError}</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    width: "100%",
    alignSelf: "center",
  },
  contentVerticalPadding: {
    paddingTop: spacing.lg,
  },
  contentVerticalPaddingWeb: {
    paddingTop: spacing.xl,
  },
  playerLayout: {
    width: "100%",
    alignItems: "center",
  },
  artworkColumn: {
    width: "100%",
    maxWidth: 420,
  },
  sectionsAlignedWithArtwork: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  errorText: {
    marginTop: spacing.sm,
    color: colors.danger,
    textAlign: "center",
  },
  pressed: { opacity: 0.85 },
});
