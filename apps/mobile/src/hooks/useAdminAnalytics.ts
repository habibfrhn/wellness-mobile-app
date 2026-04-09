import { useCallback, useEffect, useState } from "react";

import {
  type AdminAnalyticsRange,
  type AdminAudioEngagementRow,
  type AdminProductActions,
  type AdminTailoredSessionRow,
  fetchAdminAnalyticsSnapshot,
} from "../services/adminAnalytics";
import { id } from "../i18n/strings";

function logAdminAnalyticsWarning(message: string, context?: unknown) {
  if (__DEV__) {
    console.warn(`[admin-analytics] ${message}`, context);
  }
}

export function useAdminAnalytics(enabled: boolean) {
  const [range, setRange] = useState<AdminAnalyticsRange>("30d");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [productActions, setProductActions] = useState<AdminProductActions | null>(null);
  const [audioRows, setAudioRows] = useState<AdminAudioEngagementRow[]>([]);
  const [tailoredRows, setTailoredRows] = useState<AdminTailoredSessionRow[]>([]);

  const load = useCallback(
    async (nextRange: AdminAnalyticsRange = range) => {
      if (!enabled) {
        return;
      }

      setBusy(true);
      setErrorMessage(null);

      const snapshot = await fetchAdminAnalyticsSnapshot(nextRange);
      if (snapshot.error || !snapshot.data) {
        logAdminAnalyticsWarning("Failed to load analytics snapshot", snapshot.error);
        setErrorMessage(id.common.tryAgain);
        setBusy(false);
        return;
      }

      setProductActions(snapshot.data.productActions);
      setAudioRows(snapshot.data.audioRows);
      setTailoredRows(snapshot.data.tailoredRows);
      setBusy(false);
    },
    [enabled, range],
  );

  useEffect(() => {
    if (!enabled) {
      setBusy(false);
      setErrorMessage(null);
      setProductActions(null);
      setAudioRows([]);
      setTailoredRows([]);
      return;
    }

    void load(range);
  }, [enabled, load, range]);

  return {
    range,
    setRange,
    busy,
    errorMessage,
    productActions,
    audioRows,
    tailoredRows,
    reload: load,
  };
}
