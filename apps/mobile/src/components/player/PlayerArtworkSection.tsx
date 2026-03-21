import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  colors,
  controlSizes,
  radius,
  spacing,
  typography,
} from "../../theme/tokens";

type PlayerArtworkSectionProps = {
  cover: ImageSourcePropType;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  compact?: boolean;
};

export default function PlayerArtworkSection({
  cover,
  isFavorite,
  onToggleFavorite,
  compact = false,
}: PlayerArtworkSectionProps) {
  return (
    <View style={[styles.coverWrap, compact && styles.coverWrapCompact]}>
      <View style={[styles.coverFrame, compact && styles.coverFrameCompact]}>
        <Image source={cover} style={styles.cover} resizeMode="cover" />
        <Pressable
          style={[
            styles.favoriteButton,
            compact && styles.favoriteButtonCompact,
          ]}
          hitSlop={6}
          onPress={onToggleFavorite}
        >
          <FontAwesome
            name={isFavorite ? "heart" : "heart-o"}
            size={compact ? typography.body : typography.iconMd}
            color={isFavorite ? "#FF4D4D" : colors.mutedText}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  coverWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  coverWrapCompact: {
    marginTop: 0,
  },
  coverFrame: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  coverFrameCompact: {
    maxWidth: 320,
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing.xs,
    width: controlSizes.favoriteButton,
    height: controlSizes.favoriteButton,
    borderRadius: controlSizes.favoriteButton / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  favoriteButtonCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
