import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type SleepSessionExitModalProps = {
  visible: boolean;
  onConfirmExit: () => void;
  onCancel: () => void;
};

export default function SleepSessionExitModal({ visible, onConfirmExit, onCancel }: SleepSessionExitModalProps) {
  const closeModal = () => {
    if (Platform.OS === "web" && typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => onCancel());
      return;
    }
    onCancel();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={closeModal}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
        <View style={styles.card}>
          <Text style={styles.title}>{id.player.sleepSessionExitConfirm}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={closeModal}>
              <Text style={styles.secondaryText}>{id.player.sleepSessionExitNo}</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onConfirmExit}>
              <Text style={styles.primaryText}>{id.player.sleepSessionExitYes}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.text}66`,
    paddingHorizontal: spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
  },
});
