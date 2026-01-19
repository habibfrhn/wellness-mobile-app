import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { getTrackById } from "../../content/audioCatalog";
import CalmPulse from "../../components/CalmPulse";
import { colors, spacing, radius, typography } from "../../theme/tokens";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Player">;

export default function PlayerScreen({ route, navigation }: Props) {
  const { audioId } = route.params;
  const track = useMemo(() => getTrackById(audioId), [audioId]);

  // No autoplay: do not call play() on mount.
  const player = useAudioPlayer(track.asset, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", () => {
      try {
        player.pause();
      } catch {}
    });

    return () => {
      unsub();
      try {
        player.pause();
      } catch {}
    };
  }, [navigation, player]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerRight: () => null,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.artWrap}>
        <CalmPulse isActive={!!status.playing} />
        <View style={styles.centerDot} />
      </View>

      <Image source={track.cover} style={styles.cover} />
      <Text style={styles.title}>{track.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700", marginTop: spacing.md },
  artWrap: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  centerDot: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    width: "100%",
    height: 240,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
});
