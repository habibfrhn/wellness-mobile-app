import React from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { authSharedStyles } from "./AuthScreenLayout";
import { colors, spacing } from "../../theme/tokens";

type Props = TextInputProps & {
  label: string;
  rightNode?: React.ReactNode;
};

export default function AuthTextField({ label, rightNode, style, ...inputProps }: Props) {
  return (
    <View>
      <Text style={authSharedStyles.label}>{label}</Text>
      {rightNode ? (
        <View style={authSharedStyles.inputWrap}>
          <TextInput
            {...inputProps}
            placeholderTextColor={inputProps.placeholderTextColor ?? colors.mutedText}
            style={[authSharedStyles.input, styles.inputWithAccessory, style]}
          />
          {rightNode}
        </View>
      ) : (
        <TextInput
          {...inputProps}
          placeholderTextColor={inputProps.placeholderTextColor ?? colors.mutedText}
          style={[authSharedStyles.input, style]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWithAccessory: {
    paddingRight: spacing.xl,
  },
});
