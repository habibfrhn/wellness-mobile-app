import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, TextInput } from "react-native";
import { colors, spacing, radius, typography } from "../../theme/tokens";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
    "x-user-jwt": accessToken
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
    // Prefer { error: "..."}; otherwise show raw or {message:"..."}
    const msg =
      parsed?.error ||
      parsed?.message ||
      text ||
      `Edge function failed with status ${res.status}`;
    throw new Error(msg);
  }

  return parsed ?? { ok: true };
}

export default function AccountScreen() {
  const [emailValue, setEmailValue] = useState<string>("");
  const [confirmText, setConfirmText] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);

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
        text: "Lanjut",
        style: "destructive",
        onPress: async () => {
          if (!canDelete) {
            Alert.alert("Konfirmasi belum valid", 'Ketik "HAPUS" untuk melanjutkan.');
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
              Alert.alert(id.common.errorTitle, "Sesi tidak ditemukan. Silakan masuk kembali.");
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
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{id.account.emailLabel}</Text>
      <Text style={styles.email}>{emailValue || "-"}</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg, gap: spacing.md },
  sectionTitle: { fontSize: typography.small, color: colors.mutedText, fontWeight: "700" },
  email: { fontSize: typography.body, color: colors.text, fontWeight: "700" },

  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardTitle: { fontSize: typography.body, color: colors.text, fontWeight: "800" },
  cardBody: { fontSize: typography.small, color: colors.mutedText, lineHeight: 20 },

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
    backgroundColor: "#B00020",
  },
  dangerButtonText: { color: "#fff", fontSize: typography.body, fontWeight: "800", textAlign: "center" },

  secondaryButton: {
    marginTop: spacing.sm,
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
