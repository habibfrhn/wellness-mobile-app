import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PlayerArtworkSection from "../../components/player/PlayerArtworkSection";
import NormalAudioControls from "../../components/player/NormalAudioControls";
import PlayerProgressSection from "../../components/player/PlayerProgressSection";
import SoundscapeControls from "../../components/player/SoundscapeControls";
import SleepSessionProgressHeader from "../../components/player/SleepSessionProgressHeader";
import SleepSessionProgressSection from "../../components/player/SleepSessionProgressSection";
import SoundscapeTimerSection from "../../components/player/SoundscapeTimerSection";
import TailoredSessionControls from "../../components/player/TailoredSessionControls";
import SleepSessionExitModal from "../../components/SleepSessionExitModal";
import { isFavorite, toggleFavorite } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { colors, spacing, typography } from "../../theme/tokens";
import { TIMER_OPTIONS, useAudioPlayerSession } from "../../hooks/useAudioPlayerSession";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

export default function AudioPlayerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { audioId, playlistIds, sleepMode } = route.params;
  const [progressWidth, setProgressWidth] = useState(0);
  const [favorite, setFavorite] = useState(() => isFavorite(audioId));
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const isExitingSessionRef = useRef(false);

  const {
    track,
    activeStatus,
    duration,
    current,
    progressRatio,
    isPlaylistSession,
    showSoundscapeControls,
    isSessionActive,
    hasSessionStarted,
    sessionDuration,
    sessionCurrent,
    sessionProgressRatio,
    playlistIndex,
    timerSeconds,
    timerRemaining,
    onTogglePlay,
    onRestart,
    onSeek,
    handleTimerSelect,
    handleStop,
    resetPlayers,
    resetSessionState,
  } = useAudioPlayerSession({ audioId, playlistIds });

  useEffect(() => {
    setFavorite(isFavorite(track.id));
  }, [track.id]);

  const playbackMode = useMemo(() => {
    if (playlistIds && playlistIds.length > 1) {
      return "tailored_session" as const;
    }
    if (track.contentType === "soundscape") {
      return "soundscape" as const;
    }
    return "normal_audio" as const;
  }, [playlistIds, track.contentType]);
  const shouldConfirmExit = playbackMode === "tailored_session" && hasSessionStarted;
  const sessionArtwork = useMemo(() => {
    if (!isPlaylistSession) {
      return null;
    }

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
  }, [isPlaylistSession, sleepMode]);

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
    if (shouldConfirmExit) {
      setIsExitModalVisible(true);
      return;
    }

    resetPlayers();
    navigation.goBack();
  }, [navigation, resetPlayers, shouldConfirmExit]);

  useEffect(() => {
    const stopPlayback = () => {
      resetPlayers();
    };

    const unsubBeforeRemove = navigation.addListener("beforeRemove", (event) => {
      if (isExitingSessionRef.current) {
        return;
      }

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
  }, [navigation, resetPlayers, shouldConfirmExit]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerRight: () => null,
      headerLeft: () => (
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={id.login.closeLabel}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      ),
    });
  }, [handleClose, navigation]);

  const sleepSessionTitle = useMemo(
    () =>
      sleepMode === "release_accept" ? id.player.sleepSessionTitleReleaseAccept : id.player.sleepSessionTitleCalmMind,
    [sleepMode],
  );

  const sleepSessionPhase = useMemo(() => {
    if (playlistIndex === 0) {
      return id.player.sleepSessionPhaseMind;
    }
    if (playlistIndex === 1) {
      return id.player.sleepSessionPhaseBody;
    }
    return id.player.sleepSessionPhaseSoundscape;
  }, [playlistIndex]);

  const handleConfirmExitSession = useCallback(() => {
    resetSessionState();
    setIsExitModalVisible(false);
    isExitingSessionRef.current = true;
    navigation.navigate("Home");
  }, [navigation, resetSessionState]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <PlayerArtworkSection
          cover={sessionArtwork?.cover ?? track.cover}
          isFavorite={favorite}
          onToggleFavorite={() => setFavorite(toggleFavorite(track.id))}
        />

        <View style={styles.sectionsAlignedWithArtwork}>
          <SleepSessionProgressHeader
            title={isPlaylistSession ? sleepSessionTitle : track.title}
            subtitle={isPlaylistSession ? sleepSessionPhase : track.creator}
          />

          {showSoundscapeControls ? (
            <SoundscapeTimerSection
              timerOptions={TIMER_OPTIONS}
              timerSeconds={timerSeconds}
              timerRemaining={timerRemaining}
              isSessionActive={isSessionActive}
              onSelectTimer={handleTimerSelect}
            />
          ) : playbackMode === "tailored_session" ? (
            <SleepSessionProgressSection
              sessionCurrent={sessionCurrent}
              sessionDuration={sessionDuration}
              sessionProgressRatio={sessionProgressRatio}
              onLayoutWidth={setProgressWidth}
              progressWidth={progressWidth}
            />
          ) : (
            <PlayerProgressSection
              current={current}
              duration={duration}
              progressRatio={progressRatio}
              onLayoutWidth={setProgressWidth}
              onSeek={onSeekBarPress}
              progressWidth={progressWidth}
            />
          )}

          {playbackMode === "soundscape" ? (
            <SoundscapeControls isPlaying={activeStatus.playing} onStop={handleStop} onTogglePlay={onTogglePlay} />
          ) : playbackMode === "tailored_session" ? (
            <TailoredSessionControls
              isPlaying={activeStatus.playing}
              onRestart={onRestart}
              onTogglePlay={onTogglePlay}
            />
          ) : (
            <NormalAudioControls isPlaying={activeStatus.playing} onRestart={onRestart} onTogglePlay={onTogglePlay} />
          )}
        </View>
      </ScrollView>

      <SleepSessionExitModal
        visible={isExitModalVisible}
        onCancel={() => setIsExitModalVisible(false)}
        onConfirmExit={handleConfirmExitSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: {
    padding: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: typography.title,
    color: colors.text,
    fontWeight: "700",
  },
  sectionsAlignedWithArtwork: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  pressed: { opacity: 0.85 },
});
