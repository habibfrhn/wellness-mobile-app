import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as Updates from "expo-updates";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import { getPendingUpdate, setPendingUpdate } from "../../services/updatesState";
import type { AppStackParamList } from "../../navigation/types";

// Read version from apps/mobile/app.json without expo-constants.
// Safe fallback if bundler cannot resolve for some reason.
function readAppVersionFromAppJson(): string {
  try {
    // AccountScreen.tsx is at apps/mobile/src/screens/App/AccountScreen.tsx
    // "../../../app.json" -> apps/mobile/app.json
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require("../../../app.json") as any;
    const v = cfg?.expo?.version;
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    return "1.0.0";
  } catch {
    return "1.0.0";
  }
}

const APP_VERSION = readAppVersionFromAppJson();

type Props = NativeStackScreenProps<AppStackParamList, "Account">;

export default function AccountScreen({ navigation }: Props) {
  const [emailValue, setEmailValue] = useState<string>("");

  const [busyUpdateCheck, setBusyUpdateCheck] = useState(false);
  const [busyUpdateDownload, setBusyUpdateDownload] = useState(false);
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);

  const appMeta = useMemo(
    () => ({
      version: APP_VERSION,
    }),
    []
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        setEmailValue("");
      } else {
        setEmailValue(data.user?.email ?? "");
      }

      const pending = await getPendingUpdate();
      if (mounted) setHasPendingUpdate(pending);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function onLogout() {
    Alert.alert(id.account.confirmLogoutTitle, id.account.confirmLogoutBody, [
      { text: id.account.cancel, style: "cancel" },
      {
        text: id.account.logout,
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert(id.common.errorTitle, error.message);
        },
      },
    ]);
  }

  async function downloadAndReload() {
    if (busyUpdateDownload) return;

    // Updates may be disabled in Expo Go / dev environments.
    if (!Updates.isEnabled) {
      Alert.alert(id.account.updatesDisabledTitle, id.account.updatesDisabledBody);
      return;
    }

    setBusyUpdateDownload(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        await setPendingUpdate(false);
        setHasPendingUpdate(false);
        Alert.alert(id.account.updatesUpToDateTitle, id.account.updatesUpToDateBody);
        return;
      }

      await Updates.fetchUpdateAsync();
      await setPendingUpdate(false);
      setHasPendingUpdate(false);
      await Updates.reloadAsync();
    } catch {
      await setPendingUpdate(true);
      setHasPendingUpdate(true);
      Alert.alert(id.common.errorTitle, id.account.updatesFailed);
    } finally {
      setBusyUpdateDownload(false);
    }
  }

  async function onCheckUpdates() {
    if (busyUpdateCheck) return;

    // Updates may be disabled in Expo Go / dev environments.
    if (!Updates.isEnabled) {
      Alert.alert(id.account.updatesDisabledTitle, id.account.updatesDisabledBody);
      return;
    }

    setBusyUpdateCheck(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        await setPendingUpdate(false);
        setHasPendingUpdate(false);
        Alert.alert(id.account.updatesUpToDateTitle, id.account.updatesUpToDateBody);
        return;
      }

      // Update available: ask permission to download now
      Alert.alert(id.account.updatesAvailableTitle, id.account.updatesAvailableBody, [
        {
          text: id.account.updatesLater,
          style: "cancel",
          onPress: async () => {
            await setPendingUpdate(true);
            setHasPendingUpdate(true);
            Alert.alert(id.account.updatesLaterTitle, id.account.updatesLaterBody);
          },
        },
        {
          text: id.common.ok,
          onPress: async () => {
            await downloadAndReload();
          },
        },
      ]);
    } catch {
      Alert.alert(id.common.errorTitle, id.account.updatesFailed);
    } finally {
      setBusyUpdateCheck(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.sectionTitle}>{id.account.emailLabel}</Text>
        <Text style={styles.email}>{emailValue || "-"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{id.account.updatesTitle}</Text>

        <Pressable
          onPress={onCheckUpdates}
          disabled={busyUpdateCheck || busyUpdateDownload}
          style={({ pressed }) => [
            styles.primaryButton,
            (busyUpdateCheck || busyUpdateDownload) && styles.disabled,
            pressed && !(busyUpdateCheck || busyUpdateDownload) && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {busyUpdateCheck ? id.account.updatesChecking : id.account.updatesButton}
          </Text>
        </Pressable>

        <Pressable
          onPress={downloadAndReload}
          disabled={!hasPendingUpdate || busyUpdateCheck || busyUpdateDownload}
          style={({ pressed }) => [
            styles.secondaryActionButton,
            (!hasPendingUpdate || busyUpdateCheck || busyUpdateDownload) && styles.disabled,
            pressed && hasPendingUpdate && !(busyUpdateCheck || busyUpdateDownload) && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryActionButtonText}>
            {busyUpdateDownload ? id.account.updatesDownloading : id.account.updatesDownloadButton}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{id.account.securityTitle}</Text>
        <Text style={styles.cardBody}>{id.account.securityBody}</Text>
        <Pressable
          onPress={() => navigation.navigate("ResetPassword")}
          style={({ pressed }) => [styles.secondaryActionButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryActionButtonText}>{id.account.resetPasswordButton}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{id.account.aboutTitle}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{id.account.versionLabel}</Text>
          <Text style={styles.metaValue}>{appMeta.version}</Text>
        </View>
      </View>

      <Pressable onPress={onLogout} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Text style={styles.secondaryButtonText}>{id.account.logout}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    backgroundColor: colors.bg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },

  sectionTitle: { fontSize: typography.small, color: colors.mutedText, fontWeight: "700" },
  email: { fontSize: typography.body, color: colors.text, fontWeight: "700" },

  card: {
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: typography.body, color: colors.text, fontWeight: "800" },
  cardBody: { fontSize: typography.small, color: colors.mutedText, lineHeight: 20 },

  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaLabel: { fontSize: typography.small, color: colors.mutedText, fontWeight: "700" },
  metaValue: { fontSize: typography.small, color: colors.text, fontWeight: "800" },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },

  secondaryActionButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },

  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.secondaryText,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },

  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
});
