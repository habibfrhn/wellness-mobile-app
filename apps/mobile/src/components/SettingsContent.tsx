import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { id } from "../i18n/strings";
import type { AppStackParamList } from "../navigation/types";
import { supabase } from "../services/supabase";
import { colors, lineHeights, radius, spacing, typography } from "../theme/tokens";

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

function confirmOnWeb(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.confirm(`${title}\n\n${message}`);
  }

  return null;
}

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, "Settings">;
};

type RowProps = {
  label: string;
  onPress?: () => void;
  value?: string;
  valueColor?: string;
  destructive?: boolean;
  showChevron?: boolean;
  showDivider?: boolean;
  rightNode?: React.ReactNode;
};

function SettingsRow({
  label,
  onPress,
  value,
  valueColor,
  destructive = false,
  showChevron = false,
  showDivider = true,
  rightNode,
}: RowProps) {
  const content = (
    <>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightNode}
        {value ? <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text> : null}
        {showChevron ? <Text style={styles.chevron}>›</Text> : null}
      </View>
      {showDivider ? <View style={styles.rowDivider} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}>
      {content}
    </Pressable>
  );
}

export default function SettingsContent({ navigation }: Props) {
  const [emailValue, setEmailValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [initialName, setInitialName] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);

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

  async function onLogout() {
    const logoutAction = async () => {
      const { error } = await supabase.auth.signOut();
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
  }

  async function onDeleteAccount() {
    const deleteAction = async () => {
      setBusyDelete(true);
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          Alert.alert(id.common.errorTitle, sessionErr.message);
          return;
        }

        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          Alert.alert(id.common.errorTitle, id.account.sessionMissing);
          return;
        }

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          Alert.alert(id.common.errorTitle, "Supabase env belum tersedia.");
          return;
        }

        const res = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
            "x-user-jwt": accessToken,
          },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          const msg = await res.text();
          Alert.alert(id.common.errorTitle, msg || "Gagal menghapus akun.");
          return;
        }

        Alert.alert(id.account.deletedTitle, id.account.deletedBody, [
          {
            text: id.common.ok,
            onPress: async () => {
              await supabase.auth.signOut();
            },
          },
        ]);
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
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <View style={styles.sectionCard}>
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
          <SettingsRow
            label={id.account.resetPasswordButton}
            onPress={() => navigation.navigate("ResetPassword")}
            showChevron
          />
          <SettingsRow label={id.account.logout} onPress={onLogout} destructive showDivider={false} />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Tidur</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label={id.account.settingsTitle} onPress={() => navigation.navigate("NightMode")} showChevron />
          <SettingsRow
            label={id.account.reminderTitle}
            onPress={() => navigation.navigate("ReminderSettings")}
            showChevron
            showDivider={false}
          />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Dukungan</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label={id.account.helpTitle} onPress={openHelp} showChevron />
          <SettingsRow
            label={id.account.support}
            value={SUPPORT_EMAIL}
            onPress={() => {
              void safeOpenUrl(`mailto:${SUPPORT_EMAIL}`);
            }}
            showDivider={false}
          />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Tentang</Text>
        <View style={styles.sectionCard}>
          <SettingsRow label={id.account.versionLabel} value={appVersion} />
          <SettingsRow label={id.account.privacy} onPress={() => void safeOpenUrl(PRIVACY_URL)} showChevron />
          <SettingsRow
            label={id.account.terms}
            onPress={() => void safeOpenUrl(TERMS_URL)}
            showChevron
            showDivider={false}
          />
        </View>
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Zona berbahaya</Text>
        <View style={styles.sectionCard}>
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
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  sectionWrap: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.small,
    fontWeight: "700",
    color: colors.mutedText,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  rowLabel: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  rowLabelDanger: {
    color: colors.danger,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: spacing.sm,
    maxWidth: "62%",
  },
  rowValue: {
    fontSize: typography.small,
    color: colors.mutedText,
    textAlign: "right",
  },
  rowDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: `${colors.mutedText}22`,
  },
  chevron: {
    fontSize: typography.title,
    color: colors.mutedText,
    lineHeight: typography.title,
  },
  nameInput: {
    minWidth: 120,
    maxWidth: 180,
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
