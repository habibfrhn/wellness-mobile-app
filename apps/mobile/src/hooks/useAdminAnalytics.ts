import { useCallback, useEffect, useState } from "react";

import {
  type AdminAnalyticsRange,
  type AdminAudioSummary,
  type AdminFunnel,
  type AdminKpis,
  type AdminMonthlyRow,
  fetchAdminAudioSummary,
  fetchAdminFunnel,
  fetchAdminKpis,
  fetchAdminMonthly12m,
} from "../services/adminAnalytics";
import { id } from "../i18n/strings";

export function useAdminAnalytics(enabled: boolean) {
  const [range, setRange] = useState<AdminAnalyticsRange>("30d");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [funnel, setFunnel] = useState<AdminFunnel | null>(null);
  const [audioRows, setAudioRows] = useState<AdminAudioSummary[]>([]);
  const [monthlyRows, setMonthlyRows] = useState<AdminMonthlyRow[]>([]);

  const load = useCallback(
    async (nextRange: AdminAnalyticsRange = range) => {
      if (!enabled) {
        return;
      }
      setBusy(true);
      setErrorMessage(null);

      const [kpisRes, funnelRes, audioRes, monthlyRes] = await Promise.all([
        fetchAdminKpis(nextRange),
        fetchAdminFunnel(nextRange),
        fetchAdminAudioSummary(nextRange),
        nextRange === "12m" ? fetchAdminMonthly12m() : Promise.resolve({ data: [] as AdminMonthlyRow[], error: null }),
      ]);

      const firstError = kpisRes.error ?? funnelRes.error ?? audioRes.error ?? monthlyRes.error;
      if (firstError) {
        setErrorMessage(firstError.message ?? id.common.tryAgain);
        setBusy(false);
        return;
      }

      setKpis(kpisRes.data);
      setFunnel(funnelRes.data);
      setAudioRows(audioRes.data);
      setMonthlyRows(monthlyRes.data);
      setBusy(false);
    },
    [enabled, range],
  );

  useEffect(() => {
    if (!enabled) {
      setBusy(false);
      setErrorMessage(null);
      setKpis(null);
      setFunnel(null);
      setAudioRows([]);
      setMonthlyRows([]);
      return;
    }
    void load(range);
  }, [enabled, load, range]);

  return {
    range,
    setRange,
    busy,
    errorMessage,
    kpis,
    funnel,
    audioRows,
    monthlyRows,
    reload: load,
  };
}
