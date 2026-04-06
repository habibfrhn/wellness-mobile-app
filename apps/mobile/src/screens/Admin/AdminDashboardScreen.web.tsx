import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";

import AdminDashboardView from "../../components/admin/AdminDashboardView";
import AdminLoginForm from "../../components/admin/AdminLoginForm";
import { id } from "../../i18n/strings";
import { useAdminAnalytics } from "../../hooks/useAdminAnalytics";
import { supabase } from "../../services/supabase";
import { colors, spacing, typography } from "../../theme/tokens";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";

type Props = {
  session: Session | null;
};

export default function AdminDashboardScreen({ session }: Props) {
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const {
    range,
    setRange,
    busy: analyticsBusy,
    errorMessage: analyticsError,
    productActions,
    audioRows,
    tailoredRows,
    monthlyRows,
    reload,
  } = useAdminAnalytics(Boolean(session) && isAdmin === true);

  const getSafeAuthErrorMessage = useCallback((message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
      return id.admin.loginFailed;
    }

    return id.common.tryAgain;
  }, []);

  const runAdminCheck = useCallback(async () => {
    if (!session) {
      setIsAdmin(null);
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      setErrorMessage(id.admin.accessCheckFailed);
      setBusy(false);
      return;
    }

    const canAccess = Boolean(data);
    setIsAdmin(canAccess);
    setBusy(false);
  }, [session]);

  useEffect(() => {
    void runAdminCheck();
  }, [runAdminCheck]);

  const handleLogin = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage(id.admin.loginNeedEmail);
      return;
    }

    if (!password.trim()) {
      setErrorMessage(id.admin.loginNeedPassword);
      return;
    }

    setBusy(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      setErrorMessage(getSafeAuthErrorMessage(error.message));
      setBusy(false);
      return;
    }

    setBusy(false);
  }, [getSafeAuthErrorMessage]);

  const handleForgotPassword = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage(id.admin.forgotPasswordNeedEmail);
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/reset` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, redirectTo ? { redirectTo } : undefined);
    if (error) {
      setErrorMessage(id.admin.forgotPasswordSent);
      setBusy(false);
      return;
    }

    setErrorMessage(id.admin.forgotPasswordSent);
    setBusy(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(null);
  }, []);

  return (
    <WebResponsiveFrame disableFrame>
      <View style={styles.screen}>
        {!session ? (
          <AdminLoginForm
            busy={busy}
            errorMessage={errorMessage}
            onSubmit={handleLogin}
            onForgotPassword={handleForgotPassword}
          />
        ) : busy && isAdmin === null ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : isAdmin !== true ? (
          <View style={styles.unauthorizedCard}>
            <Text style={styles.unauthorizedTitle}>{id.admin.unauthorizedTitle}</Text>
            <Text style={styles.unauthorizedBody}>{id.admin.unauthorizedBody}</Text>
          </View>
        ) : (
          <AdminDashboardView
            range={range}
            onRangeChange={setRange}
            busy={analyticsBusy}
            errorMessage={analyticsError}
            productActions={productActions}
            audioRows={audioRows}
            tailoredRows={tailoredRows}
            monthlyRows={monthlyRows}
            onRefresh={reload}
            onSignOut={handleSignOut}
          />
        )}
      </View>
    </WebResponsiveFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    padding: spacing.lg,
    width: "100%",
  },
  unauthorizedCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  unauthorizedTitle: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  unauthorizedBody: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
});
