import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../theme/tokens";
import { AUDIO_TRACKS, type AudioTrack } from "../../content/audioCatalog";
import { id } from "../../i18n/strings";
import AudioTrackCard from "../../components/AudioTrackCard";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const Header = (
    <View>
      <Text style={styles.title}>{id.home.title}</Text>
      <Text style={styles.subtitle}>{id.home.subtitle}</Text>

      <View style={{ height: spacing.lg }} />
    </View>
  );

  const Footer = (
    <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
      <Text style={styles.note}>{id.home.noteNoAutoplay}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: AudioTrack }) => (
    <AudioTrackCard
      track={item}
      onPress={() => navigation.navigate("Player", { audioId: item.id })}
    />
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

  note: { fontSize: typography.small, color: colors.mutedText, lineHeight: 18 },

});
