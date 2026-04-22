import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AdminAnalyticsRange,
  type AdminAudioEngagementRow,
  type AdminProductActions,
  type AdminTailoredSessionRow,
  fetchAdminAudioEngagement,
  fetchAdminProductActions,
  fetchAdminTailoredSessions,
  isAdminUnauthorizedError,
} from "../services/adminAnalytics";
import { id } from "../i18n/strings";

export function useAdminAnalytics(enabled: boolean) {
  const [range, setRange] = useState<AdminAnalyticsRange>("30d");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [productActions, setProductActions] = useState<AdminProductActions | null>(null);
  const [audioRows, setAudioRows] = useState<AdminAudioEngagementRow[]>([]);
  const [tailoredRows, setTailoredRows] = useState<AdminTailoredSessionRow[]>([]);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (nextRange: AdminAnalyticsRange = range) => {
      if (!enabled) {
        return;
      }

      const currentRequestId = requestIdRef.current + 1;
      requestIdRef.current = currentRequestId;
      setBusy(true);
      setErrorMessage(null);
      setUnauthorized(false);

      try {
        const [actionsRes, audioRes, tailoredRes] = await Promise.all([
          fetchAdminProductActions(nextRange),
          fetchAdminAudioEngagement(nextRange),
          fetchAdminTailoredSessions(nextRange),
        ]);

        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        const firstError = actionsRes.error ?? audioRes.error ?? tailoredRes.error;
        if (firstError) {
          if (isAdminUnauthorizedError(firstError)) {
            setUnauthorized(true);
            setErrorMessage(id.admin.unauthorizedBody);
          } else {
            setErrorMessage(id.common.tryAgain);
          }
          setBusy(false);
          return;
        }

        setProductActions(actionsRes.data);
        setAudioRows(audioRes.data);
        setTailoredRows(tailoredRes.data);
        setBusy(false);
      } catch {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }
        setErrorMessage(id.common.tryAgain);
        setBusy(false);
      }
    },
    [enabled, range],
  );

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      setBusy(false);
      setErrorMessage(null);
      setUnauthorized(false);
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
    unauthorized,
    productActions,
    audioRows,
    tailoredRows,
    reload: load,
  };
}
