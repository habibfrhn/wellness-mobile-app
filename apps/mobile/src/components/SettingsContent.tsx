import React, { useEffect, useMemo, useState } from "react";
import { Alert, Clipboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";
import { canManagePassword } from "../services/authProviders";
import { supabase } from "../services/supabase";
import { colors, radius, spacing, typography } from "../theme/tokens";
import SettingsRow from "./settings/SettingsRow";
import SettingsSection from "./settings/SettingsSection";
import DeleteAccountSection from "./settings/DeleteAccountSection";

const SUPPORT_EMAIL = "lumepoapp@gmail.com";

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

function readAppVersionFromAppJson(): string {
  try {
    const cfg = require("../../app.json") as any;
    const v = cfg?.expo?.version;
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
    return "1.0.0";
  } catch {
    return "1.0.0";
  }
}

async function safeOpenUrl(url: string) {
  try {
    if (typeof window !== "undefined") {
      await Linking.openURL(url);
      return;
    }

    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert(id.common.errorTitle, id.account.openLinkFailed);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(id.common.errorTitle, id.account.openLinkFailed);
  }
}

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, "Settings">;
};

export default function SettingsContent({ navigation }: Props) {
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [initialName, setInitialName] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const appVersion = useMemo(() => readAppVersionFromAppJson(), []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) {
        return;
      }

      const userName = (data.user?.user_metadata?.full_name as string | undefined) ?? "";
      setNameValue(userName);
      setInitialName(userName);
      setEmailValue(data.user?.email ?? "-");
      setShowResetPassword(canManagePassword(data.user));
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const trimmedName = nameValue.trim();

  async function onSaveName() {
    if (!trimmedName || trimmedName === initialName.trim()) {
      return;
    }

    if (trimmedName.length > 15) {
      Alert.alert(id.common.errorTitle, id.account.nameMaxLength);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });

    if (error) {
      Alert.alert(id.common.errorTitle, error.message);
      return;
    }

    setInitialName(trimmedName);
  }

  function copySupportEmail() {
    try {
      Clipboard.setString(SUPPORT_EMAIL);
      Alert.alert(id.account.supportCopySuccessTitle, id.account.supportCopySuccessBody);
    } catch {
      Alert.alert(id.account.supportCopyFallbackTitle, SUPPORT_EMAIL);
    }
  }

  const navigateFromSettings = (route: "ResetPassword" | "PrivacyPolicy" | "TermsConditions") => {
    runAfterTouchCommit(() => {
      blurWebActiveElement();
      navigation.navigate(route);
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <SettingsSection title={id.account.title}>
        <SettingsRow
          label={id.account.nameLabel}
          rightNode={
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              onBlur={() => {
                void onSaveName();
              }}
              onSubmitEditing={() => {
                void onSaveName();
              }}
              placeholder={id.account.namePlaceholder}
              placeholderTextColor={colors.mutedText}
              style={styles.nameInput}
              returnKeyType="done"
            />
          }
        />
        <SettingsRow label={id.account.emailLabel} value={emailValue} showDivider={false} />
        {showResetPassword ? (
          <SettingsRow label={id.account.resetPasswordButton} onPress={() => navigateFromSettings("ResetPassword")} showChevron />
        ) : null}
      </SettingsSection>

      <SettingsSection title={id.account.supportSectionTitle}>
        <SettingsRow
          label={id.account.support}
          showDivider={false}
          rightNode={
            <View style={styles.supportActions}>
              <Pressable
                onPress={() => void safeOpenUrl(`mailto:${SUPPORT_EMAIL}`)}
                style={({ pressed }) => [styles.supportEmailAction, pressed && styles.pressedSupportAction]}
                accessibilityRole="button"
                accessibilityLabel={id.account.supportSendEmail}
              >
                <Text style={styles.supportEmailText}>{SUPPORT_EMAIL}</Text>
              </Pressable>
              <Pressable
                onPress={copySupportEmail}
                style={({ pressed }) => [styles.copyAction, pressed && styles.pressedSupportAction]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={id.account.supportCopyEmail}
              >
                <MaterialCommunityIcons name="content-copy" size={18} color={colors.text} />
              </Pressable>
            </View>
          }
        />
      </SettingsSection>

      <SettingsSection title={id.account.aboutSectionTitle}>
        <SettingsRow label={id.account.versionLabel} value={appVersion} />
        <SettingsRow label={id.account.privacy} onPress={() => navigateFromSettings("PrivacyPolicy")} showChevron />
        <SettingsRow label={id.account.terms} onPress={() => navigateFromSettings("TermsConditions")} showChevron showDivider={false} />
      </SettingsSection>

      <DeleteAccountSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 760,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  nameInput: {
    minWidth: 120,
    width: "100%",
    maxWidth: 220,
    fontSize: typography.small,
    color: colors.text,
    textAlign: "right",
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: colors.bg,
  },
  supportActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  supportEmailAction: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
  },
  supportEmailText: {
    fontSize: typography.small,
    color: colors.mutedText,
    textAlign: "right",
  },
  copyAction: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xs,
  },
  pressedSupportAction: {
    opacity: 0.72,
  },
});
