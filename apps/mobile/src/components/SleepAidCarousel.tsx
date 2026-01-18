import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { colors, spacing, radius, typography } from "../theme/tokens";
import type { AudioTrack } from "../content/audioCatalog";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

type SleepAidCarouselProps = {
  title: string;
  tracks: AudioTrack[];
  onPress: (track: AudioTrack) => void;
};

export default function SleepAidCarousel({ title, tracks, onPress }: SleepAidCarouselProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPress(item)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            hitSlop={6}
          >
            <Image source={item.thumbnail} style={styles.thumbnail} resizeMode="contain" />
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.creator}
              </Text>
              <Text style={styles.cardDuration}>{formatTime(item.durationSec)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.sm,
    paddingRight: spacing.lg,
  },
  card: {
    width: 150,
    height: 225,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    justifyContent: "flex-start",
  },
  thumbnail: {
    width: "100%",
    height: 112,
    borderRadius: radius.xs,
    backgroundColor: colors.bg,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: typography.small,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 18,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  cardMeta: {
    flex: 1,
    fontSize: typography.small,
    color: colors.mutedText,
    marginRight: spacing.xs,
  },
  cardDuration: {
    fontSize: typography.small,
    color: colors.mutedText,
  },
  pressed: { opacity: 0.85 },
});
