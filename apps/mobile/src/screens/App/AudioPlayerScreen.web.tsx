import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlayerArtworkSection from "../../components/player/PlayerArtworkSection";
import SleepSessionExitModal from "../../components/SleepSessionExitModal";
import HeaderCloseButton from "../../components/navigation/HeaderCloseButton";
import NormalAudioModePlayer from "../../components/player/modes/NormalAudioModePlayer";
import SoundscapeModePlayer from "../../components/player/modes/SoundscapeModePlayer";
import TailoredSessionModePlayer from "../../components/player/modes/TailoredSessionModePlayer";
import { getTrackById, isFavorite, toggleFavorite } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme/tokens";
import { getWebPageContainerStyle, getWebSectionSpacing, getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { useBrowserAudioEngine } from "../../hooks/player-web/useBrowserAudioEngine";
import { useNormalAudioModeController } from "../../hooks/player-web/useNormalAudioModeController";
import { useSoundscapeModeController } from "../../hooks/player-web/useSoundscapeModeController";
import { useTailoredSessionModeController } from "../../hooks/player-web/useTailoredSessionModeController";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

export default function AudioPlayerScreenWeb({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { audioId, playlistIds, sleepMode } = route.params;
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const sectionGap = getWebSectionSpacing(webViewport);
  const [favorite, setFavorite] = useState(() => isFavorite(audioId));
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const isExitingSessionRef = useRef(false);

  const engine = useBrowserAudioEngine();
  const initialTrack = useMemo(() => getTrackById(audioId), [audioId]);
  const playbackMode = useMemo(() => {
    if (playlistIds && playlistIds.length > 1) return "tailored_session" as const;
    if (initialTrack.contentType === "soundscape") return "soundscape" as const;
    return "normal_audio" as const;
  }, [initialTrack.contentType, playlistIds]);

  const normalMode = useNormalAudioModeController({ engine, track: initialTrack });
  const soundscapeMode = useSoundscapeModeController({ engine, track: initialTrack });
  const tailoredMode = useTailoredSessionModeController({
    engine,
    playlistIds: playlistIds ?? [audioId],
    initialAudioId: audioId,
    sleepMode,
  });

  const activeTrack = playbackMode === "tailored_session" ? tailoredMode.currentTrack : initialTrack;

  useEffect(() => {
    setFavorite(isFavorite(activeTrack.id));
  }, [activeTrack.id]);

  useEffect(() => {
    return () => {
      engine.stop();
    };
  }, [engine]);

  const shouldConfirmExit = playbackMode === "tailored_session" && tailoredMode.hasSessionStarted;
  const sessionArtwork = useMemo(() => {
    if (playbackMode !== "tailored_session") return null;

    if (sleepMode === "release_accept") {
      return {
        cover: require("../../../assets/image/cover/08-master-cover.jpg"),
        thumbnail: require("../../../assets/image/thumbnail/08-master-thumbnail.jpg"),
      };
    }

    return {
      cover: require("../../../assets/image/cover/07-master-cover.jpg"),
      thumbnail: require("../../../assets/image/thumbnail/07-master-thumbnail.jpg"),
    };
  }, [playbackMode, sleepMode]);

  const handleClose = useCallback(() => {
    if (shouldConfirmExit) {
      setIsExitModalVisible(true);
      return;
    }

    engine.stop();
    navigation.goBack();
  }, [engine, navigation, shouldConfirmExit]);

  useEffect(() => {
    const stopPlayback = () => engine.stop();

    const unsubBeforeRemove = navigation.addListener("beforeRemove", (event) => {
      if (isExitingSessionRef.current) return;
      if (!shouldConfirmExit) {
        stopPlayback();
        return;
      }
      event.preventDefault();
      setIsExitModalVisible(true);
    });

    const unsubBlur = navigation.addListener("blur", stopPlayback);
    return () => {
      unsubBeforeRemove();
      unsubBlur();
      stopPlayback();
    };
  }, [engine, navigation, shouldConfirmExit]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerStyle: { backgroundColor: colors.white },
      headerShadowVisible: false,
      headerRight: () => null,
      headerLeft: () => <HeaderCloseButton onPress={handleClose} />,
    });
  }, [handleClose, navigation]);

  const sleepSessionTitle = sleepMode === "release_accept" ? id.player.sleepSessionTitleReleaseAccept : id.player.sleepSessionTitleCalmMind;
  const sleepSessionPhase = tailoredMode.playlistIndex === 0 ? id.player.sleepSessionPhaseMind : tailoredMode.playlistIndex === 1 ? id.player.sleepSessionPhaseBody : id.player.sleepSessionPhaseSoundscape;

  const handleConfirmExitSession = useCallback(() => {
    tailoredMode.resetSession();
    setIsExitModalVisible(false);
    isExitingSessionRef.current = true;
    navigation.navigate("Home");
  }, [navigation, tailoredMode]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          getWebPageContainerStyle(webViewport, { mobile: 520, tablet: 760, desktop: 1120 }),
          styles.contentVerticalPadding,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.playerLayout, { gap: sectionGap }]}> 
          <View style={styles.artworkColumn}>
            <PlayerArtworkSection
              cover={sessionArtwork?.cover ?? activeTrack.cover}
              isFavorite={favorite}
              onToggleFavorite={() => setFavorite(toggleFavorite(activeTrack.id))}
              compact
            />
          </View>
          <View style={styles.sectionsAlignedWithArtwork}>
            {playbackMode === "tailored_session" ? (
              <TailoredSessionModePlayer
                title={sleepSessionTitle}
                subtitle={sleepSessionPhase}
                isPlaying={tailoredMode.isPlaying}
                sessionCurrent={tailoredMode.sessionCurrent}
                sessionDuration={tailoredMode.sessionDuration}
                sessionProgressRatio={tailoredMode.sessionProgressRatio}
                onTogglePlay={() => void tailoredMode.togglePlay()}
                onRestart={() => void tailoredMode.restart()}
                compact
              />
            ) : playbackMode === "soundscape" ? (
              <SoundscapeModePlayer
                track={activeTrack}
                isPlaying={soundscapeMode.isPlaying}
                current={soundscapeMode.current}
                duration={soundscapeMode.duration}
                progressRatio={soundscapeMode.progressRatio}
                timerSeconds={soundscapeMode.timerSeconds}
                timerRemaining={soundscapeMode.timerRemaining}
                isSessionActive={soundscapeMode.isSessionActive}
                onSelectTimer={soundscapeMode.selectTimer}
                onTogglePlay={() => void soundscapeMode.togglePlay()}
                onStop={soundscapeMode.stop}
                onSeek={engine.seek}
                compact
              />
            ) : (
              <NormalAudioModePlayer
                track={activeTrack}
                isPlaying={normalMode.isPlaying}
                current={normalMode.current}
                duration={normalMode.duration}
                progressRatio={normalMode.progressRatio}
                onSeek={normalMode.seek}
                onTogglePlay={() => void normalMode.togglePlay()}
                onRestart={() => void normalMode.restart()}
                compact
              />
            )}
            {engine.state.phase === "error" ? <Text style={styles.errorText}>{engine.state.error}</Text> : null}
          </View>
        </View>
      </ScrollView>

      <SleepSessionExitModal visible={isExitModalVisible} onCancel={() => setIsExitModalVisible(false)} onConfirmExit={handleConfirmExitSession} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { width: "100%", alignSelf: "center" },
  contentVerticalPadding: { paddingTop: spacing.xl },
  playerLayout: { width: "100%", alignItems: "center" },
  artworkColumn: { width: "100%", maxWidth: 320 },
  sectionsAlignedWithArtwork: { width: "100%", maxWidth: 320, alignSelf: "center" },
  errorText: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: typography.caption,
  },
});
