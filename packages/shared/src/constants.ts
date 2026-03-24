/**
 * Central app configuration. Change APP_NAME here and it cascades everywhere.
 */
export const APP_NAME = "Placeholder";
export const APP_DESCRIPTION =
  "AI-Powered UX Auditing — consultant-quality analysis in one click.";
export const APP_VERSION = "0.1.0";

export const SCORE_WEIGHTS = {
  accessibility: 0.25,
  uxHeuristics: 0.3,
  forms: 0.15,
  content: 0.1,
  visualConsistency: 0.1,
  performanceUx: 0.1,
} as const;

export const SCAN_PROGRESS_MESSAGES = [
  "Reading your page...",
  "Checking accessibility...",
  "Evaluating user experience...",
  "Analyzing forms & inputs...",
  "Reviewing visual consistency...",
  "Crunching the numbers...",
] as const;

export const SIDE_PANEL_WIDTH = 380;

/** Minimum touch target size per WCAG 2.5.8 */
export const MIN_TOUCH_TARGET_PX = 44;

/** WCAG AA contrast ratio thresholds */
export const CONTRAST_RATIO_AA_NORMAL = 4.5;
export const CONTRAST_RATIO_AA_LARGE = 3.0;

/** Large text threshold: 18px regular or 14px bold */
export const LARGE_TEXT_PX = 18;
export const LARGE_TEXT_BOLD_PX = 14;

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
