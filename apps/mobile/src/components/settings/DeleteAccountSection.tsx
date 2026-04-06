import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { id } from "../../i18n/strings";
import { deleteCurrentAccount } from "../../services/deleteAccount";
import { colors, lineHeights, radius, spacing, typography } from "../../theme/tokens";
import AppActionModal from "../common/AppActionModal";
import SettingsSection from "./SettingsSection";

const DELETE_CONFIRM_TEXT = "HAPUS";

export default function DeleteAccountSection() {
  const [busyDelete, setBusyDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string } | null>(null);

  const isConfirmValid = useMemo(() => deleteConfirmation.trim().toUpperCase() === DELETE_CONFIRM_TEXT, [deleteConfirmation]);

  function onOpenDeleteModal() {
    console.log("[delete-account] open delete modal tapped");
    setDeleteConfirmation("");
    setShowDeleteModal(true);
  }

  function onCloseDeleteModal() {
    if (busyDelete) {
      console.log("[delete-account] close ignored while busy");
      return;
    }

    console.log("[delete-account] closing delete modal");
    setShowDeleteModal(false);
    setDeleteConfirmation("");
  }

  async function onConfirmDeleteAccount() {
    console.log("[delete-account] confirm delete tapped", {
      typedValue: deleteConfirmation,
      isConfirmValid,
    });

    if (!isConfirmValid) {
      console.warn("[delete-account] confirmation text mismatch");
      setNoticeModal({ title: id.account.deleteConfirmTitle, message: id.account.deleteConfirmBody });
      return;
    }

    setBusyDelete(true);
    try {
      await deleteCurrentAccount();
      console.log("[delete-account] deleteCurrentAccount() completed");
      setNoticeModal({ title: id.account.deletedTitle, message: id.account.deletedBody });
    } catch (error) {
      const message = error instanceof Error ? error.message : id.common.tryAgain;
      console.error("[delete-account] deleteCurrentAccount() failed", { message, error });
      setNoticeModal({ title: id.common.errorTitle, message });
    } finally {
      console.log("[delete-account] resetting modal state");
      setBusyDelete(false);
      setShowDeleteModal(false);
      setDeleteConfirmation("");
    }
  }

  return (
    <>
      <SettingsSection title={id.account.dangerSectionTitle}>
        <Text style={styles.dangerText}>{id.account.deleteWarning}</Text>
        <Pressable
          onPress={onOpenDeleteModal}
          disabled={busyDelete}
          style={({ pressed }) => [styles.dangerButton, busyDelete && styles.disabled, pressed && !busyDelete && styles.pressedRow]}
        >
          <Text style={styles.dangerButtonText}>{busyDelete ? id.account.deleting : id.account.deleteFinal}</Text>
        </Pressable>
      </SettingsSection>

      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={onCloseDeleteModal}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onCloseDeleteModal} />
          <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
            <Text style={styles.title}>{id.account.deleteTitle}</Text>
            <Text style={styles.description}>{id.account.deleteWarning}</Text>

            <Text style={styles.deleteTypeLabel}>{id.account.deleteTypeLabel}</Text>
            <TextInput
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder={id.account.deletePlaceholder}
              placeholderTextColor={colors.mutedText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busyDelete}
              style={styles.deleteTypeInput}
            />

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={onCloseDeleteModal}
                disabled={busyDelete}
                style={({ pressed }) => [styles.secondaryButton, busyDelete && styles.disabled, pressed && !busyDelete && styles.pressedRow]}
              >
                <Text style={styles.secondaryText}>{id.account.cancel}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void onConfirmDeleteAccount();
                }}
                disabled={busyDelete}
                style={({ pressed }) => [styles.dangerButton, busyDelete && styles.disabled, pressed && !busyDelete && styles.pressedRow]}
              >
                <Text style={styles.dangerButtonText}>{busyDelete ? id.account.deleting : id.account.deleteContinue}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AppActionModal
        visible={Boolean(noticeModal)}
        title={noticeModal?.title ?? id.common.ok}
        description={noticeModal?.message ?? ""}
        confirmLabel={id.common.ok}
        onCancel={() => setNoticeModal(null)}
        onConfirm={() => setNoticeModal(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dangerText: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: lineHeights.normal,
    marginBottom: spacing.sm,
  },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  dangerButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.sm,
    boxShadow: "0px 10px 30px rgba(15, 23, 42, 0.2)",
  },
  title: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.text,
  },
  description: {
    fontSize: typography.body,
    color: colors.mutedText,
    lineHeight: 22,
  },
  deleteTypeLabel: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  deleteTypeInput: {
    borderWidth: 1,
    borderColor: colors.mutedText,
    borderRadius: radius.xs,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.mutedText,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  secondaryText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  pressedRow: {
    opacity: 0.82,
  },
});
