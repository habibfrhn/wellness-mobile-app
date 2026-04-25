import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors, spacing, typography } from "../theme/tokens";
import { id } from "../i18n/strings";
import { signOutToLogin } from "../services/authSession";
import type { AppStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function HomeHeaderSettingsButton({ navigation }: Props) {
  const onLogout = async () => {
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
    <View style={styles.container}>
      <Pressable
        onPress={() => navigation.navigate("Settings")}
        hitSlop={8}
        style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="cog-outline" size={typography.iconSm} color={colors.text} />
        <Text style={styles.actionText}>{id.account.settingsMenu}</Text>
      </Pressable>

      <Pressable onPress={onLogout} hitSlop={8} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="logout" size={typography.iconSm} color={colors.danger} />
        <Text style={styles.logoutText}>{id.account.logout}</Text>
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
