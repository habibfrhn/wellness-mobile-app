import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
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
  const viewportWidth = useViewportWidth();
  const isDesktopWeb = Platform.OS === "web" && getWebViewport(viewportWidth) === "desktop";

  return (
    <View
      style={[styles.controlsTapArea, compact && styles.controlsTapAreaCompact]}
    >
      <View style={[styles.controlsRow, compact && styles.controlsRowCompact]}>
        <Pressable
          onPress={onRestart}
          style={({ hovered, pressed }: any) => [
            styles.secondaryBtn,
            compact && styles.secondaryBtnCompact,
            hovered && isDesktopWeb && styles.secondaryBtnHover,
            pressed && styles.secondaryBtnPressed,
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
            hovered && isDesktopWeb && styles.primaryBtnHover,
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
  },
  primaryBtnCompact: { paddingVertical: spacing.xs + 2 },
  primaryBtnHover: { backgroundColor: colors.primaryHover },
  primaryBtnPressed: { backgroundColor: colors.primaryPressed },
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
  secondaryBtnHover: { backgroundColor: colors.secondaryHover, borderColor: colors.secondaryHover },
  secondaryBtnPressed: { backgroundColor: colors.secondaryPressed, borderColor: colors.secondaryPressed },
  secondaryText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryTextCompact: { fontSize: typography.caption },
});
