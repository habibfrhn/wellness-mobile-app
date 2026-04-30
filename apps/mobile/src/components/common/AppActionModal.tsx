import React, { useEffect, useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  busy?: boolean;
  closeOnBackdrop?: boolean;
};

export default function AppActionModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  busy = false,
  closeOnBackdrop = true,
}: Props) {
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (visible) {
      lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return;
    }

    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeElement?.blur();
    lastFocusedElementRef.current?.focus?.();
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, onCancel]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          style={styles.backdrop}
          onPress={() => {
            if (closeOnBackdrop && !busy) {
              onCancel();
            }
          }}
        />

        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.actions}>
            {cancelLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                disabled={busy}
                style={({ pressed }) => [styles.secondaryButton, busy && styles.disabled, pressed && !busy && styles.pressed]}
              >
                <Text style={styles.secondaryText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryButton,
                destructive && styles.destructiveButton,
                busy && styles.disabled,
                pressed && !busy && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryText, destructive && styles.destructiveText]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
  },
  destructiveText: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
