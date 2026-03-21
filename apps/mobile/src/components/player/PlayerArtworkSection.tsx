import FontAwesome from "@expo/vector-icons/FontAwesome";
import React from "react";
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from "react-native";

import { colors, controlSizes, radius, spacing, typography } from "../../theme/tokens";

type PlayerArtworkSectionProps = {
  cover: ImageSourcePropType;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function PlayerArtworkSection({ cover, isFavorite, onToggleFavorite }: PlayerArtworkSectionProps) {
  return (
    <View style={styles.coverWrap}>
      <View style={styles.coverFrame}>
        <Image source={cover} style={styles.cover} resizeMode="cover" />
        <Pressable style={styles.favoriteButton} hitSlop={6} onPress={onToggleFavorite}>
          <FontAwesome
            name={isFavorite ? "heart" : "heart-o"}
            size={typography.iconMd}
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
  coverFrame: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
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
});
