import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type PlayerControlsSectionProps = {
  isPlaying: boolean;
  showSoundscapeControls: boolean;
  onStop: () => void;
  onRestart: () => void;
  onTogglePlay: () => void;
};

export default function PlayerControlsSection({
  isPlaying,
  showSoundscapeControls,
  onStop,
  onRestart,
  onTogglePlay,
}: PlayerControlsSectionProps) {
  return (
    <View style={styles.controlsTapArea}>
      <View style={styles.controlsRow}>
        {showSoundscapeControls ? (
          <Pressable onPress={onStop} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>{id.player.stop}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onRestart} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>{id.player.restart}</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onTogglePlay}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>{isPlaying ? id.player.pause : id.player.start}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsTapArea: {
    marginTop: spacing.md,
  },
  controlsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: colors.primaryText, fontSize: typography.body, fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontSize: typography.caption, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.85 },
});
