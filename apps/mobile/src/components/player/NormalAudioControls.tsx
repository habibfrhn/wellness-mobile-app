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
          style={({ hovered, pressed }: any) => [
            styles.primaryBtn,
            compact && styles.primaryBtnCompact,
            hovered && styles.primaryBtnHover,
            pressed && styles.primaryBtnPressed,
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
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    boxShadow: `0px 6px 14px ${colors.text}24`,
  },
  primaryBtnHover: {
    backgroundColor: colors.secondary,
  },
  primaryBtnPressed: {
    shadowOpacity: 0,
    elevation: 0,
    boxShadow: "none",
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
  secondaryTextCompact: { fontSize: typography.caption },
  pressed: { opacity: 0.85 },
});
