import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type SleepOption = "calm_mind" | "release_accept";

type SleepOptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: SleepOption) => void;
};

export default function SleepOptionModal({ visible, onClose, onSelect }: SleepOptionModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.question}>{id.home.nightModeQuestion}</Text>

          <Pressable
            onPress={() => onSelect("calm_mind")}
            style={({ pressed }) => [styles.optionCard, pressed ? styles.pressed : null]}
          >
            <Text style={styles.optionTitle}>{id.home.nightModeCalmMindTitle}</Text>
            <Text style={styles.optionSubtitle}>{id.home.nightModeCalmMindSubtitle}</Text>
          </Pressable>

          <Pressable
            onPress={() => onSelect("release_accept")}
            style={({ pressed }) => [styles.optionCard, pressed ? styles.pressed : null]}
          >
            <Text style={styles.optionTitle}>{id.home.nightModeReleaseAcceptTitle}</Text>
            <Text style={styles.optionSubtitle}>{id.home.nightModeReleaseAcceptSubtitle}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `${colors.text}66`,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  question: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
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
