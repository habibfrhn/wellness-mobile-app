import { useCallback, useEffect, useRef, useState } from "react";

import {
  type AdminAnalyticsRange,
  type AdminAudioUsageRow,
  fetchAdminAudioUsage,
} from "../services/adminAnalytics";
import { getAdminAnalyticsErrorKind } from "../services/adminAnalyticsErrors";
import { id } from "../i18n/strings";

export function useAdminAnalytics(enabled: boolean) {
  const [range, setRange] = useState<AdminAnalyticsRange>("7d");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [audioRows, setAudioRows] = useState<AdminAudioUsageRow[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
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
          const errorKind = getAdminAnalyticsErrorKind(error);
          if (errorKind === "unauthorized") {
            setUnauthorized(true);
            setErrorMessage(id.admin.unauthorizedBody);
          } else if (errorKind === "backend_missing") {
            setErrorMessage(id.admin.analyticsBackendMissing);
          } else if (errorKind === "query_invalid") {
            setErrorMessage(id.admin.analyticsQueryInvalid);
          } else {
            setErrorMessage(id.admin.analyticsLoadFailed);
          }
          setBusy(false);
          return;
        }

        setAudioRows(data);
        setLastUpdatedAt(new Date());
        setBusy(false);
      } catch {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }
        setErrorMessage(id.admin.analyticsLoadFailed);
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
      setLastUpdatedAt(null);
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
    lastUpdatedAt,
    reload: load,
  };
}
