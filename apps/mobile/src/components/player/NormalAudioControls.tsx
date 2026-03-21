import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type NormalAudioControlsProps = {
  isPlaying: boolean;
  onRestart: () => void;
  onTogglePlay: () => void;
  compact?: boolean;
};

export default function NormalAudioControls({
  isPlaying,
  onRestart,
  onTogglePlay,
  compact = false,
}: NormalAudioControlsProps) {
  return (
    <View
      style={[styles.controlsTapArea, compact && styles.controlsTapAreaCompact]}
    >
      <View style={[styles.controlsRow, compact && styles.controlsRowCompact]}>
        <Pressable
          onPress={onRestart}
          style={({ pressed }) => [
            styles.secondaryBtn,
            compact && styles.secondaryBtnCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.secondaryText,
              compact && styles.secondaryTextCompact,
            ]}
          >
            {id.player.restart}
          </Text>
        </Pressable>

        <Pressable
          onPress={onTogglePlay}
          style={({ pressed }) => [
            styles.primaryBtn,
            compact && styles.primaryBtnCompact,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.primaryText, compact && styles.primaryTextCompact]}
          >
            {isPlaying ? id.player.pause : id.player.start}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsTapArea: {
    marginTop: spacing.md,
  },
  controlsTapAreaCompact: {
    marginTop: spacing.xs,
  },
  controlsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  controlsRowCompact: { marginTop: spacing.sm, gap: spacing.xs },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnCompact: { paddingVertical: spacing.xs + 2 },
  primaryText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
  },
  primaryTextCompact: { fontSize: typography.caption },
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
  secondaryBtnCompact: { paddingVertical: spacing.xs + 2 },
  secondaryText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryTextCompact: { fontSize: typography.small },
  pressed: { opacity: 0.85 },
});
