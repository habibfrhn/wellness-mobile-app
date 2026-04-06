import React from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { authSharedStyles } from "./AuthScreenLayout";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = TextInputProps & {
  label: string;
  rightNode?: React.ReactNode;
  errorText?: string;
};

export default function AuthTextField({ label, rightNode, style, errorText, ...inputProps }: Props) {
  return (
    <View>
      <Text style={authSharedStyles.label}>{label}</Text>
      {rightNode ? (
        <View style={authSharedStyles.inputWrap}>
          <TextInput
            {...inputProps}
            placeholderTextColor={inputProps.placeholderTextColor ?? colors.mutedText}
            style={[authSharedStyles.input, styles.inputWithAccessory, errorText && styles.inputError, style]}
          />
          {rightNode}
        </View>
      ) : (
        <TextInput
          {...inputProps}
          placeholderTextColor={inputProps.placeholderTextColor ?? colors.mutedText}
          style={[authSharedStyles.input, errorText && styles.inputError, style]}
        />
      )}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWithAccessory: {
    paddingRight: spacing.xl,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: typography.caption,
  },
});
