import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../theme/tokens";
import { AUDIO_TRACKS } from "../../content/audioCatalog";
import type { AudioTrack } from "../../content/audioCatalog";
import Carousel from "../../components/Carousel";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

const pickRandomTracks = (tracks: AudioTrack[], count: number) => {
  const pool = [...tracks];
  const picks: AudioTrack[] = [];
  while (pool.length > 0 && picks.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [track] = pool.splice(index, 1);
    if (track) picks.push(track);
  }
  return picks;
};

const formatTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const featuredSleepGuide = useMemo(() => {
    const sleepGuideTracks = AUDIO_TRACKS.filter((track) => track.contentType === "guided-sleep");
    return pickRandomTracks(sleepGuideTracks, 1)[0] ?? sleepGuideTracks[0];
  }, []);

  useEffect(() => {
    const coverUris = Array.from(
      new Set(
        AUDIO_TRACKS.map((track) => Image.resolveAssetSource(track.cover)?.uri).filter(
          (uri): uri is string => Boolean(uri)
        )
      )
    );

    coverUris.forEach((uri) => {
      Image.prefetch(uri);
    });
  }, []);

  const Header = (
    <View>
      {featuredSleepGuide ? (
        <View style={styles.featureSection}>
          <Text style={styles.featureTitle}>Bersiap untuk tidur</Text>
          <View style={styles.featureCard}>
            <View style={styles.featureRow}>
              <Image
                source={featuredSleepGuide.thumbnail}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureMeta}>
                <Text style={styles.featureTrackTitle} numberOfLines={2}>
                  {featuredSleepGuide.title}
                </Text>
                <View style={styles.featureMetaRow}>
                  <Text style={styles.featureMetaText} numberOfLines={1}>
                    {featuredSleepGuide.creator}
                  </Text>
                  <Text style={styles.featureMetaDivider}>·</Text>
                  <Text style={styles.featureMetaText}>{formatTime(featuredSleepGuide.durationSec)}</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Player", { audioId: featuredSleepGuide.id })}
              style={({ pressed }) => [styles.featureButton, pressed && styles.featureButtonPressed]}
            >
              <Text style={styles.featureButtonText}>Mulai</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <Carousel
        title="Tidur dengan panduan"
        tracks={AUDIO_TRACKS.filter((track) => track.contentType === "guided-sleep")}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
      <Carousel
        title="Soundscape untuk tidur"
        tracks={AUDIO_TRACKS.filter((track) => track.contentType === "soundscape")}
        onPress={(track) => navigation.navigate("Player", { audioId: track.id })}
      />
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: spacing.sm + insets.bottom } // critical for Android nav bar overlap
      ]}
      showsVerticalScrollIndicator={false}
    >
      {Header}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  featureSection: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.sm,
  },
  featureCard: {
    marginHorizontal: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  featureImage: {
    width: 120,
    height: 90,
    borderRadius: 12,
  },
  featureMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  featureTrackTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  featureMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  featureMetaText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  featureMetaDivider: {
    fontSize: 12,
    color: colors.mutedText,
  },
  featureButton: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  featureButtonPressed: {
    opacity: 0.85,
  },
  featureButtonText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: "700",
  },
});
