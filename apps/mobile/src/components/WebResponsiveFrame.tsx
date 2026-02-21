import React, { ReactNode } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, spacing } from "../theme/tokens";
import useViewportWidth from "../hooks/useViewportWidth";

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  disableFrame?: boolean;
};

const WEB_BREAKPOINT = 640;

export default function WebResponsiveFrame({ children, contentStyle, disableFrame = false }: Props) {
  const width = useViewportWidth();

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  if (width <= WEB_BREAKPOINT) {
    return <>{children}</>;
  }

  if (disableFrame) {
    return <View style={styles.fullWidth}>{children}</View>;
  }

  return (
    <View style={styles.page}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    flex: 1,
    width: "100%",
    minHeight: "100vh" as unknown as number,
  },
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
