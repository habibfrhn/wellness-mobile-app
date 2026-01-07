import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { AUDIO_TRACKS } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{id.home.title}</Text>
      <Text style={styles.subtitle}>{id.home.subtitle}</Text>

      <View style={styles.list}>
        {AUDIO_TRACKS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => navigation.navigate("Player", { audioId: t.id })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            hitSlop={6}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.badge}>{id.home.durationBadge}</Text>
            </View>

            <Text style={styles.cardSubtitle}>{t.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.note}>{id.home.noteNoAutoplay}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  title: { fontSize: typography.h2, color: colors.text, fontWeight: "700", marginTop: spacing.sm },
  subtitle: { marginTop: spacing.xs, fontSize: typography.body, color: colors.mutedText, lineHeight: 22 },

  list: { marginTop: spacing.lg, gap: spacing.sm },
  card: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md
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
    overflow: "hidden"
  },
  cardSubtitle: { marginTop: 6, fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },

  note: { marginTop: spacing.lg, fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },
  pressed: { opacity: 0.85 }
});
