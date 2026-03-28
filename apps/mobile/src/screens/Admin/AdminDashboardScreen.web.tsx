import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";

import AdminDashboardView from "../../components/admin/AdminDashboardView";
import AdminLoginForm from "../../components/admin/AdminLoginForm";
import { id } from "../../i18n/strings";
import { supabase } from "../../services/supabase";
import { colors, spacing, typography } from "../../theme/tokens";
import WebResponsiveFrame from "../../components/WebResponsiveFrame";

type Props = {
  session: Session | null;
};

type AudioMetric = {
  audio_id: string;
  plays: number;
  completes: number;
  abandons: number;
  completion_rate: number;
};

type FunnelMetric = {
  page_views: number;
  cta_clicks: number;
  signup_starts: number;
  signup_completes: number;
};

type TailoredMetric = {
  sessions_started: number;
  sessions_completed: number;
  sessions_dropped: number;
  completion_rate: number;
};

export default function AdminDashboardScreen({ session }: Props) {
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [audioMetrics, setAudioMetrics] = useState<AudioMetric[]>([]);
  const [funnelMetric, setFunnelMetric] = useState<FunnelMetric | null>(null);
  const [tailoredMetric, setTailoredMetric] = useState<TailoredMetric | null>(null);

  const runAdminCheck = useCallback(async () => {
    if (!session) {
      setIsAdmin(null);
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      setErrorMessage(error.message);
      setBusy(false);
      return;
    }

    const canAccess = Boolean(data);
    setIsAdmin(canAccess);
    setBusy(false);
  }, [session]);

  const loadDashboard = useCallback(async () => {
    setBusy(true);
    setErrorMessage(null);

    const [{ data: audioData, error: audioError }, { data: funnelData, error: funnelError }, { data: tailoredData, error: tailoredError }] =
      await Promise.all([
        supabase.from("analytics_audio_summary").select("*").order("plays", { ascending: false }).limit(20),
        supabase.from("analytics_funnel_summary").select("*").limit(1).maybeSingle(),
        supabase.from("analytics_tailored_summary").select("*").limit(1).maybeSingle(),
      ]);

    if (audioError || funnelError || tailoredError) {
      setErrorMessage(audioError?.message ?? funnelError?.message ?? tailoredError?.message ?? id.common.tryAgain);
      setBusy(false);
      return;
    }

    setAudioMetrics((audioData ?? []) as AudioMetric[]);
    setFunnelMetric((funnelData as FunnelMetric | null) ?? null);
    setTailoredMetric((tailoredData as TailoredMetric | null) ?? null);
    setBusy(false);
  }, []);

  useEffect(() => {
    void runAdminCheck();
  }, [runAdminCheck]);

  useEffect(() => {
    if (!session || isAdmin !== true) {
      return;
    }

    void loadDashboard();
  }, [isAdmin, loadDashboard, session]);

  const handleLogin = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setBusy(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) {
      setErrorMessage(error.message);
      setBusy(false);
      return;
    }

    setBusy(false);
  }, []);

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
      setErrorMessage(error.message);
      setBusy(false);
      return;
    }

    setErrorMessage(id.admin.forgotPasswordSent);
    setBusy(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(null);
    setAudioMetrics([]);
    setFunnelMetric(null);
    setTailoredMetric(null);
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
            audioMetrics={audioMetrics}
            funnelMetric={funnelMetric}
            tailoredMetric={tailoredMetric}
            onRefresh={loadDashboard}
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
    alignItems: "center",
    justifyContent: "center",
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
