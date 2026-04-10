import React, { useMemo } from "react";

import { colors, controlSizes, radius, spacing, typography } from "../../theme/tokens";

type PlayerProgressSectionProps = {
  current: number;
  duration: number;
  progressRatio: number;
  onLayoutWidth: (width: number) => void;
  onSeek: (locationX: number) => void;
  progressWidth: number;
  compact?: boolean;
};

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function PlayerProgressSection({
  current,
  duration,
  progressRatio,
  onLayoutWidth,
  onSeek,
  progressWidth,
  compact = false,
}: PlayerProgressSectionProps) {
  const progressHandleSize = spacing.sm;
  const progressHandleLeft = useMemo(() => {
    if (!progressWidth) {
      return 0;
    }
    return Math.min(Math.max(progressRatio * progressWidth - progressHandleSize / 2, 0), progressWidth - progressHandleSize);
  }, [progressHandleSize, progressRatio, progressWidth]);

  return (
    <>
      <div
        style={{ marginTop: compact ? spacing.md : spacing.xl, cursor: "pointer" }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(event.clientX - rect.left);
        }}
      >
        <div
          ref={(node) => {
            if (!node) {
              return;
            }
            onLayoutWidth(node.getBoundingClientRect().width);
          }}
          style={{
            height: controlSizes.progressHeight,
            borderRadius: radius.full,
            backgroundColor: colors.bg,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: radius.full,
              backgroundColor: colors.primary,
              width: progressWidth ? `${progressRatio * 100}%` : "0%",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: spacing.sm,
              height: spacing.sm,
              borderRadius: spacing.sm / 2,
              backgroundColor: colors.primary,
              top: "50%",
              left: progressHandleLeft,
              transform: `translateY(-${spacing.sm / 2}px)`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.xs / 2,
          marginBottom: compact ? spacing.md : spacing.xl,
          fontSize: typography.caption,
          color: colors.mutedText,
        }}
      >
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </>
  );
}
