import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function WebFrame({ children, contentStyle }: Props) {
  return (
    <View style={styles.page}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  content: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    boxShadow: `0px 8px 24px ${colors.text}14`,
  },
});
