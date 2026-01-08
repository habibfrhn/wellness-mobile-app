import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { AUDIO_TRACKS, getTrackById, type AudioTrack } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { loadProgress, type PlayerProgress } from "../../services/playerProgress";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);

  useEffect(() => {
    let alive = true;

    async function refresh() {
      const p = await loadProgress();
      if (!alive) return;
      setProgress(p);
    }

    const unsub = navigation.addListener("focus", refresh);
    void refresh();

    return () => {
      alive = false;
      unsub();
    };
  }, [navigation]);

  const continueMeta = useMemo(() => {
    if (!progress) return null;

    try {
      const track = getTrackById(progress.audioId);
      const pos = Math.max(0, progress.positionSec);
      if (pos < 5 || pos >= track.durationSec - 1) return null;
      return { track, pos };
    } catch {
      return null;
    }
  }, [progress]);

  const Header = (
    <View>
      <Text style={styles.title}>{id.home.title}</Text>
      <Text style={styles.subtitle}>{id.home.subtitle}</Text>

      {continueMeta && (
        <Pressable
          onPress={() =>
            navigation.navigate("Player", {
              audioId: continueMeta.track.id,
              resume: true,
            })
          }
          style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
          hitSlop={6}
        >
          <Text style={styles.continueLabel}>{id.home.continueLabel}</Text>
          <Text style={styles.continueTitle}>{continueMeta.track.title}</Text>
          <Text style={styles.continueSub}>
            {id.home.continueFrom} {formatTime(continueMeta.pos)}
          </Text>
        </Pressable>
      )}

      <View style={{ height: spacing.lg }} />
    </View>
  );

  const Footer = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
      <Text style={styles.note}>{id.home.noteNoAutoplay}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: AudioTrack }) => (
    <Pressable
      onPress={() => navigation.navigate("Player", { audioId: item.id })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      hitSlop={6}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.badge}>{id.home.durationBadge}</Text>
      </View>

      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
    </Pressable>
  );

  return (
    <FlatList
      data={AUDIO_TRACKS}
      keyExtractor={(t) => t.id}
      renderItem={renderItem}
      ListHeaderComponent={Header}
      ListFooterComponent={Footer}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: spacing.lg + insets.bottom } // critical for Android nav bar overlap
      ]}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },

  title: {
    fontSize: typography.h2,
    color: colors.text,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },

  continueCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  continueLabel: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontWeight: "700",
    marginBottom: 6,
  },
  continueTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },
  continueSub: {
    marginTop: 6,
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: 18,
  },

  card: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: typography.body, fontWeight: "700", color: colors.text },
  badge: {
    fontSize: typography.small,
    color: colors.secondaryText,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  cardSubtitle: { marginTop: 6, fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },

  note: { fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },

  pressed: { opacity: 0.85 },
});
