import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type SleepOption = "calm_mind" | "release_accept";

type SleepOptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: SleepOption) => void;
};

export default function SleepOptionModal({
  visible,
  onClose,
  onSelect,
}: SleepOptionModalProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modalCard}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.question}>{id.home.nightModeQuestion}</Text>
          <Text style={styles.subtitle}>{id.home.nightModeSubtitle}</Text>

          <Pressable
            onPress={() => onSelect("calm_mind")}
            style={({ pressed }) => [
              styles.optionCard,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.optionTitle}>
              {id.home.nightModeCalmMindTitle}
            </Text>
            <Text style={styles.optionSubtitle}>
              {id.home.nightModeCalmMindSubtitle}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onSelect("release_accept")}
            style={({ pressed }) => [
              styles.optionCard,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.optionTitle}>
              {id.home.nightModeReleaseAcceptTitle}
            </Text>
            <Text style={styles.optionSubtitle}>
              {id.home.nightModeReleaseAcceptSubtitle}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const optionCardShadowStyle =
  Platform.OS === "web"
    ? { boxShadow: `0px 3px 10px ${colors.text}1A` }
    : {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
      };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `${colors.text}66`,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  question: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
    marginBottom: spacing.xs,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    ...optionCardShadowStyle,
  },
  optionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  optionSubtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  pressed: {
    opacity: 0.85,
  },
});
