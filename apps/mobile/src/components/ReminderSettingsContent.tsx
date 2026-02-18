import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { id } from "../i18n/strings";
import {
  getNightReminderSettings,
  setNightReminderSettings,
  syncNightReminderSchedule,
} from "../services/nightReminder";
import { colors, radius, spacing, typography } from "../theme/tokens";

export default function ReminderSettingsContent() {
  const [enabled, setEnabled] = useState(false);
  const [timeText, setTimeText] = useState("22:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const saved = await getNightReminderSettings();
      if (!mounted) return;

      setEnabled(saved.enabled);
      setTimeText(formatTime(saved.hour, saved.minute));
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const parsedTime = useMemo(() => parseTimeInput(timeText), [timeText]);
  const isTimeValid = parsedTime !== null;

  async function onSave() {
    if (saving) return;

    if (!isTimeValid) {
      Alert.alert(id.common.errorTitle, id.account.reminderInvalidTime);
      return;
    }

    setSaving(true);
    try {
      const next = await setNightReminderSettings({
        enabled,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
      });

      await syncNightReminderSchedule(next);
      Alert.alert(id.common.ok, id.account.reminderSaved);
    } catch {
      Alert.alert(id.common.errorTitle, id.account.reminderSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{id.account.reminderScreenTitle}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>{id.account.reminderEnableLabel}</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>

        <Text style={styles.label}>{id.account.reminderTimeLabel}</Text>
        <TextInput
          value={timeText}
          onChangeText={setTimeText}
          keyboardType="numbers-and-punctuation"
          placeholder="22:00"
          autoCorrect={false}
          autoCapitalize="none"
          style={[styles.input, !isTimeValid ? styles.inputInvalid : null]}
        />
        <Text style={styles.hint}>{id.account.reminderTimeHint}</Text>

        <Pressable onPress={onSave} disabled={saving} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{saving ? id.account.reminderSaving : id.account.reminderSave}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function parseTimeInput(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: typography.body,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  hint: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
  button: {
    marginTop: spacing.xs,
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.text,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
