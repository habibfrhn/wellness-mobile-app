import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import * as Updates from "expo-updates";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import { getPendingUpdate, setPendingUpdate } from "../../services/updatesState";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

// Build is optional in MVP; keep "-" unless you want to manage it
const APP_BUILD = Platform.OS === "android" ? "-" : "-";

// Replace with real hosted URLs when ready (recommended for store compliance).
const PRIVACY_URL = "";
const TERMS_URL = "";

// Updated support email (your requested address)
const SUPPORT_EMAIL = "habibfrhn@gmail.com";

async function callDeleteAccount(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).");
  }

  const endpoint = `${SUPABASE_URL}/functions/v1/delete-account`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "x-user-jwt": accessToken,
    },
    body: JSON.stringify({}),
  });

  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = parsed?.error || parsed?.message || text || `Edge function failed with status ${res.status}`;
    throw new Error(msg);
  }

  return parsed ?? { ok: true };
}

async function safeOpenUrl(url: string) {
  try {
    if (!url) {
      Alert.alert(id.account.comingSoonTitle, id.account.comingSoonBody);
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

async function safeOpenEmail(email: string) {
  const mailto = `mailto:${email}`;
  await safeOpenUrl(mailto);
}

export default function AccountScreen() {
  const [emailValue, setEmailValue] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);

  const [busyUpdateCheck, setBusyUpdateCheck] = useState(false);
  const [busyUpdateDownload, setBusyUpdateDownload] = useState(false);
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false);

  const updateChannel = useMemo(() => {
    // expo-updates: channel exists when using EAS Update channels.
    // Keep safe fallbacks for Expo Go / older runtime cases.
    const anyUpdates = Updates as any;
    return (anyUpdates?.channel ?? anyUpdates?.releaseChannel ?? "-") as string;
  }, []);

  const runtimeVersion = useMemo(() => {
    try {
      const rv = (Updates as any)?.runtimeVersion;
      if (typeof rv === "string" && rv.trim().length > 0) return rv.trim();
      if (typeof rv === "number") return String(rv);
      return "-";
    } catch {
      return "-";
    }
  }, []);

  const appMeta = useMemo(
    () => ({
      version: APP_VERSION,
      build: APP_BUILD,
      runtimeVersion,
      channel: updateChannel,
    }),
    [updateChannel, runtimeVersion]
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

  const canDelete = useMemo(
    () => confirmText.trim().toUpperCase() === "HAPUS" && !busyDelete,
    [confirmText, busyDelete]
  );

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

  async function onDeleteAccount() {
    Alert.alert(id.account.deleteTitle, id.account.deleteWarning, [
      { text: id.account.cancel, style: "cancel" },
      {
        text: id.account.deleteContinue,
        style: "destructive",
        onPress: async () => {
          if (!canDelete) {
            Alert.alert(id.account.deleteConfirmTitle, id.account.deleteConfirmBody);
            return;
          }

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

            await callDeleteAccount(accessToken);

            Alert.alert(id.account.deletedTitle, id.account.deletedBody, [
              {
                text: id.common.ok,
                onPress: async () => {
                  await supabase.auth.signOut();
                },
              },
            ]);
          } catch (e: any) {
            Alert.alert(id.common.errorTitle, String(e?.message ?? e));
          } finally {
            setBusyDelete(false);
          }
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
        <Text style={styles.cardTitle}>{id.account.aboutTitle}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{id.account.versionLabel}</Text>
          <Text style={styles.metaValue}>{appMeta.version}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{id.account.buildLabel}</Text>
          <Text style={styles.metaValue}>{appMeta.build}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{id.account.runtimeLabel}</Text>
          <Text style={styles.metaValue}>{appMeta.runtimeVersion}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{id.account.channelLabel}</Text>
          <Text style={styles.metaValue}>{appMeta.channel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{id.account.helpTitle}</Text>
        <Text style={styles.cardBody}>{id.account.helpNoAutoplay}</Text>
        <Text style={styles.cardBody}>{id.account.helpVerify}</Text>
        <Text style={styles.cardBody}>{id.account.helpPlayback}</Text>
        <Text style={styles.cardBody}>{id.account.helpStoreUpdateNote}</Text>
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

        <Text style={styles.cardBody}>
          {id.account.channelLabel}:{" "}
          <Text style={{ fontWeight: "800", color: colors.text }}>{appMeta.channel}</Text>
        </Text>
        <Text style={styles.cardBody}>
          {id.account.runtimeLabel}:{" "}
          <Text style={{ fontWeight: "800", color: colors.text }}>{appMeta.runtimeVersion}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{id.account.legalTitle}</Text>

        <Pressable
          onPress={() => safeOpenUrl(PRIVACY_URL)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.linkText}>{id.account.privacy}</Text>
        </Pressable>

        <Pressable
          onPress={() => safeOpenUrl(TERMS_URL)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.linkText}>{id.account.terms}</Text>
        </Pressable>

        <Pressable
          onPress={() => safeOpenEmail(SUPPORT_EMAIL)}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Text style={styles.linkText}>{id.account.support}</Text>
          <Text style={styles.linkSub}>{SUPPORT_EMAIL}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{id.account.deleteTitle}</Text>
        <Text style={styles.cardBody}>{id.account.deleteWarning}</Text>

        <Text style={styles.label}>{id.account.deleteTypeLabel}</Text>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={id.account.deletePlaceholder}
          placeholderTextColor={colors.mutedText}
          style={styles.input}
        />

        <Pressable
          onPress={onDeleteAccount}
          disabled={!canDelete}
          style={({ pressed }) => [
            styles.dangerButton,
            !canDelete && styles.disabled,
            pressed && canDelete && styles.pressed,
          ]}
        >
          <Text style={styles.dangerButtonText}>{busyDelete ? id.account.deleting : id.account.deleteFinal}</Text>
        </Pressable>
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
    backgroundColor: colors.secondary,
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

  linkRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    gap: 4,
  },
  linkText: { fontSize: typography.body, color: colors.text, fontWeight: "800" },
  linkSub: { fontSize: typography.small, color: colors.mutedText },

  label: { fontSize: typography.small, color: colors.text, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.bg,
  },

  dangerButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
  },
  dangerButtonText: {
    color: colors.primaryText,
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
