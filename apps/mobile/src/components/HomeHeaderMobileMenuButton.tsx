import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";
import { signOutToLogin } from "../services/authSession";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function HomeHeaderMobileMenuButton({ navigation }: Props) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerWrapRef = useRef<View>(null);

  const closeMenu = () => setIsMenuVisible(false);

  const updateMenuPosition = useCallback(() => {
    if (!triggerWrapRef.current?.measureInWindow) {
      return;
    }

    triggerWrapRef.current.measureInWindow((x, y, width, height) => {
      const menuWidth = 172;
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : x + width + spacing.sm;
      const left = Math.max(spacing.sm, Math.min(x + width - menuWidth, viewportWidth - menuWidth - spacing.sm));

      setMenuPosition({
        top: y + height + spacing.xs,
        left,
      });
    });
  }, []);

  useEffect(() => {
    if (!isMenuVisible) {
      return;
    }

    updateMenuPosition();

    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      updateMenuPosition();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuVisible, updateMenuPosition]);

  const toggleMenu = () => {
    if (isMenuVisible) {
      closeMenu();
      return;
    }

    updateMenuPosition();
    setIsMenuVisible(true);
  };

  const handleSettingsPress = () => {
    closeMenu();
    navigation.navigate("Settings");
  };

  const handleLogoutPress = async () => {
    closeMenu();

    const logoutAction = async () => {
      const { error } = await signOutToLogin();
      if (error) {
        Alert.alert(id.common.errorTitle, error.message);
      }
    };

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
    <View style={styles.root}>
      <View ref={triggerWrapRef} collapsable={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={id.common.menu}
          onPress={toggleMenu}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            name="menu"
            size={typography.iconMd}
            color={colors.text}
          />
        </Pressable>
      </View>

      <Modal transparent animationType="fade" visible={isMenuVisible} onRequestClose={closeMenu}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeMenu} />
          {menuPosition ? (
            <View style={[styles.menuCard, menuPosition]}>
              <Pressable
                onPress={handleSettingsPress}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={typography.iconSm}
                  color={colors.text}
                />
                <Text style={styles.menuText}>{id.account.settingsMenu}</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleLogoutPress();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.pressed,
                  styles.lastItem,
                ]}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={typography.iconSm}
                  color={colors.danger}
                />
                <Text style={styles.logoutText}>{id.account.logout}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  iconButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0px 4px 12px ${colors.text}1F`,
  },
  menuCard: {
    position: "absolute",
    zIndex: 1000,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    minWidth: 172,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    boxShadow: `0px 8px 24px ${colors.text}26`,
  },
  menuItem: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lastItem: {
    marginTop: spacing.xs / 2,
  },
  menuText: {
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
