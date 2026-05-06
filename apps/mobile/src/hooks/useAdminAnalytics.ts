import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AdminAnalyticsRange,
  type AdminAudioUsageRow,
  fetchAdminAudioUsage,
  isAdminUnauthorizedError,
} from "../services/adminAnalytics";
import { id } from "../i18n/strings";

export function useAdminAnalytics(enabled: boolean) {
  const [range, setRange] = useState<AdminAnalyticsRange>("7d");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [audioRows, setAudioRows] = useState<AdminAudioUsageRow[]>([]);
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
        const { data, error } = await fetchAdminAudioUsage(nextRange);

        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        if (error) {
          if (isAdminUnauthorizedError(error)) {
            setUnauthorized(true);
            setErrorMessage(id.admin.unauthorizedBody);
          } else {
            setErrorMessage(id.common.tryAgain);
          }
          setBusy(false);
          return;
        }

        setAudioRows(data);
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
      setAudioRows([]);
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
    audioRows,
    reload: load,
  };
}
