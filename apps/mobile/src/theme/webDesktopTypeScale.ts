import { Platform } from "react-native";

import { lineHeights, spacing, typography } from "./tokens";

const WEB_DESKTOP_BREAKPOINT = 640;

type WebDesktopTypeScale = {
  isDesktopWeb: boolean;
  headingSize: number;
  headingLineHeight: number;
  bodyLineHeight: number;
  sectionGap: number;
  sectionPadding: number;
  buttonPaddingVertical: number;
  buttonMinHeight: number;
  titleToSubtitleGap: number;
};

export function getWebDesktopTypeScale(width: number): WebDesktopTypeScale {
  const isDesktopWeb = Platform.OS === "web" && width > WEB_DESKTOP_BREAKPOINT;

  if (!isDesktopWeb) {
    return {
      isDesktopWeb,
      headingSize: typography.h1,
      headingLineHeight: typography.h1 + spacing.sm,
      bodyLineHeight: lineHeights.relaxed,
      sectionGap: spacing.md,
      sectionPadding: spacing.lg,
      buttonPaddingVertical: spacing.md,
      buttonMinHeight: 0,
      titleToSubtitleGap: spacing.sm,
    };
  }

  return {
    isDesktopWeb,
    headingSize: typography.h1 + 6,
    headingLineHeight: typography.h1 + spacing.lg,
    bodyLineHeight: lineHeights.relaxed + spacing.xs,
    sectionGap: spacing.lg,
    sectionPadding: spacing.xl,
    buttonPaddingVertical: spacing.lg,
    buttonMinHeight: 56,
    titleToSubtitleGap: spacing.md,
  };
}
