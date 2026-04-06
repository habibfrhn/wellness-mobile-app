import { useCallback, useEffect, useState } from "react";

import {
  type AdminAnalyticsRange,
  type AdminAudioEngagementRow,
  type AdminProductActions,
  type AdminTailoredSessionRow,
  fetchAdminAudioEngagement,
  fetchAdminProductActions,
  fetchAdminTailoredSessions,
} from "../services/adminAnalytics";
import { id } from "../i18n/strings";

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

      const [actionsRes, audioRes, tailoredRes] = await Promise.all([
        fetchAdminProductActions(nextRange),
        fetchAdminAudioEngagement(nextRange),
        fetchAdminTailoredSessions(nextRange),
      ]);

      const firstError = actionsRes.error ?? audioRes.error ?? tailoredRes.error;
      if (firstError) {
        setErrorMessage(id.common.tryAgain);
        setBusy(false);
        return;
      }

      setProductActions(actionsRes.data);
      setAudioRows(audioRes.data);
      setTailoredRows(tailoredRes.data);
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
