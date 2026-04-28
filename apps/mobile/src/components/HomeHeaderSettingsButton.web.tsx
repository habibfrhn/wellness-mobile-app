import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { getWebViewport } from "../constants/webLayout";
import { colors, spacing, typography } from "../theme/tokens";
import { id } from "../i18n/strings";
import useViewportWidth from "../hooks/useViewportWidth";
import { signOutToLogin } from "../services/authSession";
import { logLogoutEvent } from "../services/logoutDebug";
import type { AppStackParamList } from "../navigation/types";
import AppActionModal from "./common/AppActionModal";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

function runAfterTouchCommit(callback: () => void) {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      callback();
    });
    return;
  }

  setTimeout(callback, 0);
}

function blurWebActiveElement() {
  if (typeof document === "undefined") {
    return;
  }

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

export default function HomeHeaderSettingsButton({ navigation }: Props) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [busyLogout, setBusyLogout] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const viewport = getWebViewport(useViewportWidth());
  const isDesktop = viewport === "desktop";
  const onOpenSettings = () => {
    runAfterTouchCommit(() => {
      blurWebActiveElement();
      navigation.navigate("Settings");
    });
  };

  const onLogout = async () => {
    logLogoutEvent("info", "logout_action_triggered", { source: "home_settings_button" });
    blurWebActiveElement();
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    logLogoutEvent("info", "logout_action_confirmed", { source: "home_settings_button" });
    setBusyLogout(true);
    const { error } = await signOutToLogin("global", { source: "home_settings_button" });
    if (error) {
      logLogoutEvent("error", "logout_action_failed", { source: "home_settings_button", error: error.message });
      setNotice(error.message);
    } else {
      logLogoutEvent("info", "logout_action_succeeded", { source: "home_settings_button" });
    }
    setBusyLogout(false);
    setShowLogoutModal(false);
  };

  return (
    <View style={[styles.container, !isDesktop && styles.containerCompact]}>
      <Pressable
        onPress={onOpenSettings}
        hitSlop={8}
        style={({ pressed }) => [styles.actionButton, !isDesktop && styles.actionButtonCompact, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="cog-outline" size={typography.iconSm} color={colors.text} />
        {isDesktop ? <Text style={styles.actionText}>{id.account.settingsMenu}</Text> : null}
      </Pressable>

      <Pressable
        onPress={() => {
          runAfterTouchCommit(() => {
            void onLogout();
          });
        }}
        hitSlop={8}
        style={({ pressed }) => [styles.actionButton, !isDesktop && styles.actionButtonCompact, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="logout" size={typography.iconSm} color={colors.danger} />
        {isDesktop ? <Text style={styles.logoutText}>{id.account.logout}</Text> : null}
      </Pressable>

      <AppActionModal
        visible={showLogoutModal}
        title={id.account.confirmLogoutTitle}
        description={id.account.confirmLogoutBody}
        confirmLabel={busyLogout ? id.login.busyCta : id.account.logout}
        cancelLabel={id.account.cancel}
        busy={busyLogout}
        onCancel={() => {
          if (!busyLogout) {
            setShowLogoutModal(false);
          }
        }}
        onConfirm={() => {
          void confirmLogout();
        }}
      />

      <AppActionModal
        visible={Boolean(notice)}
        title={id.common.errorTitle}
        description={notice ?? ""}
        confirmLabel={id.common.ok}
        onCancel={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
      />
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
