import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type SleepSessionExitModalProps = {
  visible: boolean;
  onConfirmExit: () => void;
  onCancel: () => void;
};

export default function SleepSessionExitModal({ visible, onConfirmExit, onCancel }: SleepSessionExitModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{id.player.sleepSessionExitConfirm}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onCancel}>
              <Text style={styles.secondaryText}>{id.player.sleepSessionExitNo}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmExit}
              style={({ hovered, pressed }: any) => [
                styles.primaryBtn,
                hovered && styles.primaryBtnHover,
                pressed && styles.primaryBtnPressed,
              ]}
            >
              <Text style={styles.primaryText}>{id.player.sleepSessionExitYes}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
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
