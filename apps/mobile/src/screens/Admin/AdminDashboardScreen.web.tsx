import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";

import AdminDashboardView from "../../components/admin/AdminDashboardView";
import AdminLoginForm from "../../components/admin/AdminLoginForm";
import { id } from "../../i18n/strings";
import { useAdminAnalytics } from "../../hooks/useAdminAnalytics";
import { isInvalidCredentialsError } from "../../services/authSecurity";
import { supabase } from "../../services/supabase";
import { signOutToLogin } from "../../services/authSession";
import { logLogoutEvent } from "../../services/logoutDebug";
import { colors, spacing, typography } from "../../theme/tokens";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";

type Props = {
  session: Session | null;
};

export default function AdminDashboardScreen({ session }: Props) {
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const adminCheckRequestIdRef = useRef(0);
  const { range, setRange, busy: analyticsBusy, errorMessage: analyticsError, unauthorized: analyticsUnauthorized, productActions, audioRows, tailoredRows, reload } =
    useAdminAnalytics(Boolean(session) && isAdmin === true);

  const getSafeAuthErrorMessage = useCallback((message: string) => {
    if (isInvalidCredentialsError(message)) {
      return id.admin.loginFailed;
    }

    return id.common.tryAgain;
  }, []);

  const runAdminCheck = useCallback(async () => {
    const currentRequestId = adminCheckRequestIdRef.current + 1;
    adminCheckRequestIdRef.current = currentRequestId;

    if (!session) {
      setIsAdmin(null);
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    const { data, error } = await supabase.rpc("is_admin");
    if (adminCheckRequestIdRef.current !== currentRequestId) {
      return;
    }

    if (error) {
      if (isInvalidCredentialsError(error.message)) {
        await signOutToLogin("global", { source: "admin_dashboard" });
        setIsAdmin(null);
        setErrorMessage(id.admin.loginFailed);
      } else {
        setErrorMessage(id.admin.accessCheckFailed);
      }
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

  useEffect(() => {
    return () => {
      adminCheckRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!analyticsUnauthorized) {
      return;
    }
    setIsAdmin(false);
  }, [analyticsUnauthorized]);

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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        setErrorMessage(getSafeAuthErrorMessage(error.message));
        return;
      }
    } finally {
      setBusy(false);
    }
  }, [getSafeAuthErrorMessage]);

  const handleForgotPassword = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage(id.admin.forgotPasswordNeedEmail);
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/reset` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, redirectTo ? { redirectTo } : undefined);
      if (error) {
        setErrorMessage(id.common.tryAgain);
        return;
      }

      setErrorMessage(id.admin.forgotPasswordSent);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    logLogoutEvent("info", "logout_action_triggered", { source: "admin_dashboard" });
    await signOutToLogin("global", { source: "admin_dashboard" });
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
          <View style={styles.dashboardWrap}>
            <AdminDashboardView
              busy={analyticsBusy}
              errorMessage={analyticsError}
              range={range}
              onRangeChange={setRange}
              homeSleepClicks={productActions?.home_sleep_clicks ?? 0}
              successfulSignups={productActions?.successful_signups ?? 0}
              audioRows={audioRows}
              tailoredRows={tailoredRows}
              onRefresh={reload}
              onSignOut={handleSignOut}
            />
          </View>
        )}
      </View>
    </WebResponsiveFrame>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    width: "100%",
  },
  dashboardWrap: {
    width: "100%",
    flex: 1,
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
