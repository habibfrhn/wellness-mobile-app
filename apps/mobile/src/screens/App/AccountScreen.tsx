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
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Keep MVP simple: match apps/mobile/app.json ("version": "1.0.0")
const APP_VERSION = "1.0.0";
// Build is optional in MVP; keep "-" unless you want to manage it
const APP_BUILD = Platform.OS === "android" ? "-" : "-";

// Placeholders for MVP (replace later with real URLs)
const PRIVACY_URL = "";
const TERMS_URL = "";
const SUPPORT_EMAIL = "support@wellnessapp.id";

async function callDeleteAccount(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing Supabase env (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  const endpoint = `${SUPABASE_URL}/functions/v1/delete-account`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
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
    const msg =
      parsed?.error ||
      parsed?.message ||
      text ||
      `Edge function failed with status ${res.status}`;
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

  const appMeta = useMemo(
    () => ({ version: APP_VERSION, build: APP_BUILD }),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        setEmailValue("");
        return;
      }
      setEmailValue(data.user?.email ?? "");
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
            const { data: sessionData, error: sessionErr } =
              await supabase.auth.getSession();

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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
          <Text style={styles.dangerButtonText}>
            {busyDelete ? id.account.deleting : id.account.deleteFinal}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
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

  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
