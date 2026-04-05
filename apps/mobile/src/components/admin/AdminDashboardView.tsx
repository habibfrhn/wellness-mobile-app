import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import type {
  AdminAnalyticsRange,
  AdminAudioEngagementRow,
  AdminProductActions,
  AdminTailoredSessionRow,
} from "../../services/adminAnalytics";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import AdminAudioSummaryPanel from "./AdminAudioSummaryPanel";
import AdminDateRangeFilter from "./AdminDateRangeFilter";
import AdminProductActionsPanel from "./AdminProductActionsPanel";
import AdminTailoredSessionsPanel from "./AdminTailoredSessionsPanel";

type Props = {
  range: AdminAnalyticsRange;
  onRangeChange: (next: AdminAnalyticsRange) => void;
  busy: boolean;
  errorMessage: string | null;
  productActions: AdminProductActions | null;
  audioRows: AdminAudioEngagementRow[];
  tailoredRows: AdminTailoredSessionRow[];
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function AdminDashboardView({
  range,
  onRangeChange,
  busy,
  errorMessage,
  productActions,
  audioRows,
  tailoredRows,
  onRefresh,
  onSignOut,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>{id.admin.dashboardTitle}</Text>
          <Text style={styles.subtitle}>{id.admin.dashboardSubtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={({ hovered, pressed }: any) => [
              styles.secondaryButton,
              hovered && styles.secondaryButtonHover,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={() => void onRefresh()}
          >
            {({ hovered, pressed }: any) => (
              <Text
                style={[
                  styles.secondaryButtonText,
                  hovered && styles.secondaryButtonHoverText,
                  pressed && styles.secondaryButtonPressedText,
                ]}
              >
                {busy ? id.admin.loadingLabel : id.admin.refreshCta}
              </Text>
            )}
          </Pressable>
          <Pressable
            style={({ hovered, pressed }: any) => [
              styles.secondaryButton,
              hovered && styles.secondaryButtonHover,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={() => void onSignOut()}
          >
            {({ hovered, pressed }: any) => (
              <Text
                style={[
                  styles.secondaryButtonText,
                  hovered && styles.secondaryButtonHoverText,
                  pressed && styles.secondaryButtonPressedText,
                ]}
              >
                {id.admin.signOutCta}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <AdminDateRangeFilter value={range} onChange={onRangeChange} />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <AdminProductActionsPanel actions={productActions} />
      <AdminAudioSummaryPanel rows={audioRows} />
      <AdminTailoredSessionsPanel rows={tailoredRows} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 260,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontSize: typography.h2,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: typography.small,
  },
  secondaryButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.secondaryBorder,
    fontSize: typography.small,
    fontWeight: "600",
  },
  secondaryButtonHover: {
    backgroundColor: colors.secondaryHover,
    borderColor: colors.secondaryHoverBorder,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.secondaryPressed,
    borderColor: colors.secondaryPressedBorder,
  },
  secondaryButtonHoverText: { color: colors.secondaryHoverText },
  secondaryButtonPressedText: { color: colors.secondaryPressedText },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
});
