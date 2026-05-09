import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";

type PauseFeeling = "busyMind" | "tenseBody" | "anxious" | "tired" | "unsure";
type FlowStep = "checkIn" | "pause" | "end";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const FEELING_OPTIONS: { value: PauseFeeling; label: string }[] = [
  { value: "busyMind", label: id.home.bedtimePauseOptionBusyMind },
  { value: "tenseBody", label: id.home.bedtimePauseOptionTenseBody },
  { value: "anxious", label: id.home.bedtimePauseOptionAnxious },
  { value: "tired", label: id.home.bedtimePauseOptionTired },
  { value: "unsure", label: id.home.bedtimePauseOptionUnsure },
];

const PAUSE_COPY: Record<PauseFeeling, { title: string; body: string }> = {
  busyMind: {
    title: id.home.bedtimePauseBusyMindTitle,
    body: id.home.bedtimePauseBusyMindBody,
  },
  tenseBody: {
    title: id.home.bedtimePauseTenseBodyTitle,
    body: id.home.bedtimePauseTenseBodyBody,
  },
  anxious: {
    title: id.home.bedtimePauseAnxiousTitle,
    body: id.home.bedtimePauseAnxiousBody,
  },
  tired: {
    title: id.home.bedtimePauseTiredTitle,
    body: id.home.bedtimePauseTiredBody,
  },
  unsure: {
    title: id.home.bedtimePauseUnsureTitle,
    body: id.home.bedtimePauseUnsureBody,
  },
};

function BreathingCircle() {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.72, duration: 2400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.88, duration: 2600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.45, duration: 2600, useNativeDriver: true }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity, scale]);

  return (
    <View style={styles.breathingWrap}>
      <Animated.View style={[styles.breathingCircle, { opacity, transform: [{ scale }] }]} />
    </View>
  );
}

export default function BedtimePauseFlowModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<FlowStep>("checkIn");
  const [selectedFeeling, setSelectedFeeling] = useState<PauseFeeling | null>(null);

  useEffect(() => {
    if (visible) {
      setStep("checkIn");
      setSelectedFeeling(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  const canContinueFromCheckIn = selectedFeeling !== null;
  const pauseCopy = selectedFeeling ? PAUSE_COPY[selectedFeeling] : PAUSE_COPY.unsure;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={id.home.bedtimePauseCloseLabel}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={id.home.bedtimePauseCloseLabel}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          {step === "checkIn" ? (
            <>
              <Text style={styles.title}>{id.home.bedtimePauseCheckInTitle}</Text>
              <Text style={styles.body}>{id.home.bedtimePauseCheckInSubtitle}</Text>

              <View style={styles.optionList}>
                {FEELING_OPTIONS.map((option) => {
                  const selected = selectedFeeling === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setSelectedFeeling(option.value)}
                      style={({ pressed }) => [
                        styles.option,
                        selected && styles.optionSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!canContinueFromCheckIn}
                onPress={() => setStep("pause")}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canContinueFromCheckIn && styles.disabled,
                  pressed && canContinueFromCheckIn && styles.pressed,
                ]}
              >
                <Text style={styles.primaryText}>{id.home.bedtimePauseCheckInContinueCta}</Text>
              </Pressable>
            </>
          ) : null}

          {step === "pause" ? (
            <>
              <BreathingCircle />
              <Text style={styles.title}>{pauseCopy.title}</Text>
              <Text style={styles.body}>{pauseCopy.body}</Text>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep("end")}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryText}>{id.home.bedtimePauseInstructionSkipCta}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep("end")}
                  style={({ pressed }) => [styles.primaryButton, styles.actionButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryText}>{id.home.bedtimePauseInstructionContinueCta}</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {step === "end" ? (
            <>
              <Text style={styles.title}>{id.home.bedtimePauseEndTitle}</Text>
              <Text style={styles.body}>{id.home.bedtimePauseEndBody}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>{id.home.bedtimePauseEndCta}</Text>
              </Pressable>
            </>
          ) : null}
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
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
    boxShadow: "0px 20px 50px rgba(15, 23, 42, 0.24)",
  },
  closeButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeText: {
    color: colors.mutedText,
    fontSize: 28,
    lineHeight: 30,
  },
  title: {
    paddingRight: spacing.xl,
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: "800",
    lineHeight: 28,
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 24,
  },
  optionList: {
    gap: spacing.xs,
  },
  option: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(33, 50, 94, 0.14)",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(33, 50, 94, 0.08)",
  },
  optionText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  primaryText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(33, 50, 94, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  breathingWrap: {
    height: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  breathingCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(33, 50, 94, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(33, 50, 94, 0.18)",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.86,
  },
});
