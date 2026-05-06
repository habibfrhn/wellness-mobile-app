import { useCallback, useRef } from "react";

import type { AudioId } from "../content/audioCatalog";
import { createAudioPlaySessionId, trackEvent } from "../services/analytics";

export const AUDIO_USAGE_FINISH_THRESHOLD = 0.8;

type UseAudioUsageTrackingArgs = {
  audioId: AudioId;
  progressRatio: number;
};

export function useAudioUsageTracking({ audioId, progressRatio }: UseAudioUsageTrackingArgs) {
  const hasTrackedStartRef = useRef(false);
  const hasClosedSessionRef = useRef(false);
  const playSessionIdRef = useRef<string | null>(null);

  const resetAudioUsageSession = useCallback(() => {
    hasTrackedStartRef.current = false;
    hasClosedSessionRef.current = false;
    playSessionIdRef.current = null;
  }, []);

  const trackAudioStart = useCallback(() => {
    if (hasTrackedStartRef.current) {
      return;
    }

    hasTrackedStartRef.current = true;
    hasClosedSessionRef.current = false;
    playSessionIdRef.current = createAudioPlaySessionId();

    void trackEvent(
      "audio_start",
      {
        audio_id: audioId,
        play_session_id: playSessionIdRef.current,
      },
      { flushImmediately: true },
    );
  }, [audioId]);

  const trackAudioFinish = useCallback(() => {
    if (hasClosedSessionRef.current || !hasTrackedStartRef.current || !playSessionIdRef.current) {
      return;
    }

    hasClosedSessionRef.current = true;

    void trackEvent(
      "audio_finish",
      {
        audio_id: audioId,
        play_session_id: playSessionIdRef.current,
        progress_ratio: Math.max(AUDIO_USAGE_FINISH_THRESHOLD, Math.min(progressRatio || 1, 1)),
      },
      { flushImmediately: true },
    );
  }, [audioId, progressRatio]);

  const closeAudioUsageSession = useCallback(() => {
    if (hasClosedSessionRef.current || !hasTrackedStartRef.current) {
      return;
    }

    if (progressRatio >= AUDIO_USAGE_FINISH_THRESHOLD) {
      trackAudioFinish();
      return;
    }

    hasClosedSessionRef.current = true;
  }, [progressRatio, trackAudioFinish]);

  return {
    closeAudioUsageSession,
    resetAudioUsageSession,
    trackAudioFinish,
    trackAudioStart,
  };
}
