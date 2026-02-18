import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import { recordNightSession } from "../../services/nightSessions";
import { getNightDateKey } from "../../services/nightStreak";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "NightCheckOut">;

const STRESS_LEVELS = [1, 2, 3, 4, 5] as const;

export default function NightCheckOutScreen({ navigation, route }: Props) {
  const { mode, stressBefore } = route.params;
  const [stressAfter, setStressAfter] = useState<number>(3);
  const [feedback, setFeedback] = useState<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleFinish = () => {
    const message = stressAfter < stressBefore ? id.home.nightCheckOutBetter : id.home.nightCheckOutRetry;
    setFeedback(message);

    timeoutRef.current = setTimeout(() => {
      // Persist to Supabase in the background. Failures are intentionally ignored
      // so users can continue seamlessly when offline or when backend is unavailable.
      void recordNightSession({
        date_key: getNightDateKey(),
        mode,
        stress_before: stressBefore,
        stress_after: stressAfter,
      });

      navigation.navigate("Home", {
        completed: true,
        stressBefore,
        stressAfter,
      });
    }, 900);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{id.home.nightCheckOutQuestion}</Text>

      <View style={styles.selectorRow}>
        {STRESS_LEVELS.map((level) => {
          const selected = level === stressAfter;
          return (
            <Pressable
              key={level}
              onPress={() => setStressAfter(level)}
              style={[styles.levelButton, selected ? styles.levelButtonSelected : null]}
            >
              <Text style={[styles.levelText, selected ? styles.levelTextSelected : null]}>{level}</Text>
            </Pressable>
          );
        })}
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Pressable onPress={handleFinish} style={styles.finishButton}>
        <Text style={styles.finishButtonText}>{id.home.nightCheckOutFinishCta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  question: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  selectorRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  levelButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  levelButtonSelected: {
    backgroundColor: colors.primary,
  },
  levelText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  levelTextSelected: {
    color: colors.primaryText,
  },
  feedback: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: typography.body,
  },
  finishButton: {
    marginTop: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.text,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  finishButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "600",
  },
});
