import React from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, radius, spacing, typography } from "../theme/tokens";
import type { FoundingMemberFormValues, FoundingMemberOptionValue } from "../services/foundingMember";

type Props = {
  values: FoundingMemberFormValues;
  onChange: <K extends keyof FoundingMemberFormValues>(key: K, value: FoundingMemberFormValues[K]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
};

const SLEEP_FREQUENCY_OPTIONS: FoundingMemberOptionValue[] = [
  "hampir_setiap_malam",
  "beberapa_kali_seminggu",
  "kadang_kadang",
];

const SUPPORT_OPTIONS: FoundingMemberOptionValue[] = ["ya", "mungkin", "tidak"];

const PRICE_OPTIONS: FoundingMemberOptionValue[] = ["29000", "49000", "79000", "99000_plus"];

function OptionRow({
  options,
  selected,
  onSelect,
  labelMap,
}: {
  options: FoundingMemberOptionValue[];
  selected: FoundingMemberOptionValue | "";
  onSelect: (option: FoundingMemberOptionValue) => void;
  labelMap: Record<FoundingMemberOptionValue, string>;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map((option) => {
        const active = selected === option;

        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={[styles.optionPill, active && styles.optionPillActive]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{labelMap[option]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function FoundingMemberForm({
  values,
  onChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}: Props) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>{id.foundingMember.nameLabel}</Text>
      <TextInput
        value={values.name}
        onChangeText={(value) => onChange("name", value)}
        style={styles.input}
        placeholder={id.foundingMember.namePlaceholder}
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.emailLabel}</Text>
      <TextInput
        value={values.email}
        onChangeText={(value) => onChange("email", value)}
        style={styles.input}
        placeholder={id.foundingMember.emailPlaceholder}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.sleepIssueLabel}</Text>
      <TextInput
        value={values.sleepIssue}
        onChangeText={(value) => onChange("sleepIssue", value)}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.sleepFrequencyLabel}</Text>
      <OptionRow
        options={SLEEP_FREQUENCY_OPTIONS}
        selected={values.sleepFrequency}
        onSelect={(option) => onChange("sleepFrequency", option)}
        labelMap={id.foundingMember.optionLabels}
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.whyJoinLabel}</Text>
      <TextInput
        value={values.whyJoin}
        onChangeText={(value) => onChange("whyJoin", value)}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.feedbackWillingnessLabel}</Text>
      <OptionRow
        options={SUPPORT_OPTIONS}
        selected={values.feedbackWillingness}
        onSelect={(option) => onChange("feedbackWillingness", option)}
        labelMap={id.foundingMember.optionLabels}
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.interviewWillingnessLabel}</Text>
      <OptionRow
        options={SUPPORT_OPTIONS}
        selected={values.interviewWillingness}
        onSelect={(option) => onChange("interviewWillingness", option)}
        labelMap={id.foundingMember.optionLabels}
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.paymentWillingnessLabel}</Text>
      <OptionRow
        options={SUPPORT_OPTIONS}
        selected={values.paymentWillingness}
        onSelect={(option) => onChange("paymentWillingness", option)}
        labelMap={id.foundingMember.optionLabels}
      />

      <Text style={styles.fieldLabel}>{id.foundingMember.priceLabel}</Text>
      <OptionRow
        options={PRICE_OPTIONS}
        selected={values.preferredPrice}
        onSelect={(option) => onChange("preferredPrice", option)}
        labelMap={id.foundingMember.optionLabels}
      />

      <View style={styles.checkboxRow}>
        <Switch value={values.consentToContact} onValueChange={(value) => onChange("consentToContact", value)} />
        <Text style={styles.checkboxLabel}>{id.foundingMember.consentLabel}</Text>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable onPress={onSubmit} style={styles.submitButton} disabled={isSubmitting}>
        <Text style={styles.submitButtonText}>
          {isSubmitting ? id.foundingMember.submittingCta : id.foundingMember.submitCta}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    fontSize: typography.body,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  optionPillActive: {
    backgroundColor: `${colors.primary}14`,
    borderColor: `${colors.primary}66`,
  },
  optionText: {
    fontSize: typography.small,
    lineHeight: 18,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
    color: colors.text,
  },
  errorText: {
    fontSize: typography.small,
    lineHeight: 18,
    color: colors.danger,
  },
  submitButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  submitButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: "700",
  },
});
