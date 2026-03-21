import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getWebViewport } from "../constants/webLayout";
import { colors, spacing, typography } from "../theme/tokens";
import { id } from "../i18n/strings";
import useViewportWidth from "../hooks/useViewportWidth";
import { signOutToLogin } from "../services/authSession";
import type { AppStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

function confirmOnWeb(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return null;
}

export default function HomeHeaderSettingsButton({ navigation }: Props) {
  const viewport = getWebViewport(useViewportWidth());
  const isDesktop = viewport === "desktop";

  const onLogout = async () => {
    const logoutAction = async () => {
      const { error } = await signOutToLogin();
      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
      }
    };

    const approvedOnWeb = confirmOnWeb(id.account.confirmLogoutTitle, id.account.confirmLogoutBody);
    if (approvedOnWeb !== null) {
      if (approvedOnWeb) {
        await logoutAction();
      }
      return;
    }

    Alert.alert(id.account.confirmLogoutTitle, id.account.confirmLogoutBody, [
      { text: id.account.cancel, style: "cancel" },
      {
        text: id.account.logout,
        style: "destructive",
        onPress: () => {
          void logoutAction();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, !isDesktop && styles.containerCompact]}>
      <Pressable
        onPress={() => navigation.navigate("Settings")}
        hitSlop={8}
        style={({ pressed }) => [styles.actionButton, !isDesktop && styles.actionButtonCompact, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="cog-outline" size={typography.iconSm} color={colors.text} />
        {isDesktop ? <Text style={styles.actionText}>{id.account.settingsMenu}</Text> : null}
      </Pressable>

      <Pressable
        onPress={onLogout}
        hitSlop={8}
        style={({ pressed }) => [styles.actionButton, !isDesktop && styles.actionButtonCompact, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="logout" size={typography.iconSm} color={colors.danger} />
        {isDesktop ? <Text style={styles.logoutText}>{id.account.logout}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  containerCompact: {
    gap: spacing.xs,
    paddingRight: 0,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonCompact: {
    width: 36,
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  actionText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "600",
  },
  logoutText: {
    color: colors.danger,
    fontSize: typography.small,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
