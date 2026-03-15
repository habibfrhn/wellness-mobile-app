import React, { useLayoutEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { colors, lineHeights, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
};

export default function AuthScreenLayout({ title, subtitle, children, showCloseButton = true }: Props) {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "",
      headerShadowVisible: false,
      headerLeft: showCloseButton
        ? () => (
            <Pressable
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate("Landing" as never);
                  return;
                }
                navigation.navigate("Welcome" as never);
              }}
              style={({ pressed }) => [styles.closeButton, pressed && authSharedStyles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Tutup"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, showCloseButton]);
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.panel}>
        <View style={styles.headerStack}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {children}
      </View>
    </ScrollView>
  );
}

export const authSharedStyles = StyleSheet.create({
  formFields: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  inputWrap: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.mutedText,
    minHeight: 52,
  },
  actionsStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    width: "100%",
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  screenContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    padding: 36,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    boxShadow: "0px 8px 28px rgba(33,50,94,0.12)",
  },
  closeButton: {
    width: 36,
    height: 36,
    marginLeft: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: typography.title,
    color: colors.text,
    fontWeight: "700",
  },
  headerStack: {
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.h1,
    color: colors.primary,
    fontWeight: "700",
    textAlign: "left",
  },
  subtitle: {
    fontSize: typography.small,
    color: colors.mutedText,
    lineHeight: lineHeights.relaxed,
    textAlign: "left",
  },
});
