import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";
import { canManagePassword } from "../services/authProviders";
import { deleteCurrentAccount } from "../services/deleteAccount";
import { supabase } from "../services/supabase";
import { colors, lineHeights, radius, spacing, typography } from "../theme/tokens";
import SettingsRow from "./settings/SettingsRow";
import SettingsSection from "./settings/SettingsSection";

const PRIVACY_URL =
  "https://sedate-fascinator-c12.notion.site/Kebijakan-Privasi-Privacy-Policy-2ef636185de080219298d7a6a9bcba55?source=copy_link";
const TERMS_URL =
  "https://sedate-fascinator-c12.notion.site/Ketentuan-Syarat-Terms-Conditions-2ef636185de080edb67ce5f6be718a7e?source=copy_link";
const SUPPORT_EMAIL = "habibfrhn@gmail.com";

function readAppVersionFromAppJson(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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

function showMessage(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}

${message}`);
    return;
  }

  Alert.alert(title, message);
}

function confirmOnWeb(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return null;
}

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, "Settings">;
};

export default function SettingsContent({ navigation }: Props) {
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [initialName, setInitialName] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);
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

  async function onDeleteAccount() {
    const deleteAction = async () => {
      setBusyDelete(true);
      try {
        await deleteCurrentAccount();
        showMessage(id.account.deletedTitle, id.account.deletedBody);
      } catch (error) {
        const message = error instanceof Error ? error.message : id.common.tryAgain;
        showMessage(id.common.errorTitle, message);
      } finally {
        setBusyDelete(false);
      }
    };

    const approvedOnWeb = confirmOnWeb(id.account.deleteTitle, id.account.deleteWarning);
    if (approvedOnWeb !== null) {
      if (approvedOnWeb) {
        await deleteAction();
      }
      return;
    }

    Alert.alert(id.account.deleteTitle, id.account.deleteWarning, [
      { text: id.account.cancel, style: "cancel" },
      {
        text: id.account.deleteContinue,
        style: "destructive",
        onPress: () => {
          void deleteAction();
        },
      },
    ]);
  }

  function openHelp() {
    Alert.alert(id.account.helpTitle, `${id.account.helpNoAutoplay}\n\n${id.account.helpPlayback}`);
  }

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
          <SettingsRow label={id.account.resetPasswordButton} onPress={() => navigation.navigate("ResetPassword")} showChevron />
        ) : null}
      </SettingsSection>

      <SettingsSection title={id.account.supportSectionTitle}>
        <SettingsRow label={id.account.helpTitle} onPress={openHelp} showChevron />
        <SettingsRow
          label={id.account.support}
          value={SUPPORT_EMAIL}
          onPress={() => {
            void safeOpenUrl(`mailto:${SUPPORT_EMAIL}`);
          }}
          showDivider={false}
        />
      </SettingsSection>

      <SettingsSection title={id.account.aboutSectionTitle}>
        <SettingsRow label={id.account.versionLabel} value={appVersion} />
        <SettingsRow label={id.account.privacy} onPress={() => void safeOpenUrl(PRIVACY_URL)} showChevron />
        <SettingsRow label={id.account.terms} onPress={() => void safeOpenUrl(TERMS_URL)} showChevron showDivider={false} />
      </SettingsSection>

      <SettingsSection title={id.account.dangerSectionTitle}>
        <Text style={styles.dangerText}>{id.account.deleteWarning}</Text>
        <Pressable
          onPress={() => {
            void onDeleteAccount();
          }}
          disabled={busyDelete}
          style={({ pressed }) => [styles.dangerButton, busyDelete && styles.disabled, pressed && !busyDelete && styles.pressedRow]}
        >
          <Text style={styles.dangerButtonText}>{busyDelete ? id.account.deleting : id.account.deleteFinal}</Text>
        </Pressable>
      </SettingsSection>
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
    maxWidth: 720,
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
  dangerText: {
    color: colors.mutedText,
    fontSize: typography.small,
    lineHeight: lineHeights.normal,
    marginBottom: spacing.sm,
  },
  dangerButton: {
    width: "100%",
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.55,
  },
  pressedRow: {
    opacity: 0.82,
  },
});
