import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";
import { signOutToLogin } from "../services/authSession";
import { colors, radius, spacing, typography } from "../theme/tokens";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

function confirmOnWeb(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return null;
}

export default function HomeHeaderMobileMenuButton({ navigation }: Props) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const closeMenu = () => setIsMenuVisible(false);

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

    const approvedOnWeb = confirmOnWeb(
      id.account.confirmLogoutTitle,
      id.account.confirmLogoutBody,
    );

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
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={id.common.menu}
        onPress={() => setIsMenuVisible((previous) => !previous)}
        hitSlop={8}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name="menu"
          size={typography.iconMd}
          color={colors.text}
        />
      </Pressable>

      {isMenuVisible ? (
        <View style={styles.menuCard}>
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
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  iconButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: radius.sm,
    minHeight: 40,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuCard: {
    position: "absolute",
    top: 46,
    right: 0,
    zIndex: 10,
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
