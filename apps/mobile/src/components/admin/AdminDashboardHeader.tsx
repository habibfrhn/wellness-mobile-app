import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = {
  busy: boolean;
  lastUpdatedAt: Date | null;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

function formatLastUpdated(value: Date | null) {
  if (!value) {
    return null;
  }

  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboardHeader({ busy, lastUpdatedAt, onRefresh, onSignOut }: Props) {
  const lastUpdatedLabel = formatLastUpdated(lastUpdatedAt);

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.title}>{id.admin.dashboardTitle}</Text>
        <Text style={styles.subtitle}>{id.admin.dashboardSubtitle}</Text>
        {lastUpdatedLabel ? (
          <Text style={styles.lastUpdated}>{`${id.admin.lastUpdatedLabel}: ${lastUpdatedLabel}`}</Text>
        ) : null}
      </View>
      <View style={styles.headerActions}>
        <Pressable disabled={busy} style={styles.secondaryButton} onPress={() => void onRefresh()}>
          <Text style={styles.secondaryButtonText}>{busy ? id.admin.loadingLabel : id.admin.refreshCta}</Text>
        </Pressable>
        <Pressable disabled={busy} style={styles.secondaryButton} onPress={() => void onSignOut()}>
          <Text style={styles.secondaryButtonText}>{id.admin.signOutCta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  lastUpdated: {
    marginTop: spacing.xs,
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  secondaryButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: typography.small,
    fontWeight: "600",
  },
});
