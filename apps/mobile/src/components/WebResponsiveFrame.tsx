import React, { ReactNode } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";
import useViewportWidth from "../hooks/useViewportWidth";

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

const WEB_BREAKPOINT = 640;

export default function WebResponsiveFrame({ children, contentStyle }: Props) {
  const width = useViewportWidth();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  if (width <= WEB_BREAKPOINT) {
    return <>{children}</>;
  }

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
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    marginHorizontal: "auto",
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    boxShadow: `0px 8px 24px ${colors.text}14`,
  },
});
