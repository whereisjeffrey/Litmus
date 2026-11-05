/**
 * In-panel caches so repeat goal analyses don't redo expensive work.
 *
 * Two caches, both keyed by URL and time-boxed:
 *   1. Capture cache — the full-page screenshots for a URL. Capturing scrolls
 *      the page and takes several shots (~3-4s); it's identical for every goal
 *      on the same page, so we capture once and reuse.
 *   2. Result cache — a completed GoalAnalysisResult for an identical request
 *      (same goal + scope + URL). A repeat returns instantly with no journey
 *      walk and no Claude spend.
 *
 * Cleared whenever the user runs a fresh standard scan (see App "Re-scan").
 */

import type { GoalId, GoalAnalysisResult, JourneyStep, SiteUnderstanding } from "@placeholder/shared";

const CAPTURE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const UNDERSTANDING_TTL_MS = 30 * 60 * 1000; // 30 minutes (per-site, changes slowly)

function now(): number {
  return Date.now();
}

/** Normalize so trivial differences (hash, trailing slash) share a cache slot. */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

// ─── Capture cache ──────────────────────────────────────────────────

interface CaptureEntry {
  screenshots: string[];
  at: number;
}

const captureCache = new Map<string, CaptureEntry>();

export function getCachedCapture(url: string): string[] | undefined {
  const entry = captureCache.get(normalizeUrl(url));
  if (!entry) return undefined;
  if (now() - entry.at > CAPTURE_TTL_MS) {
    captureCache.delete(normalizeUrl(url));
    return undefined;
  }
  return entry.screenshots;
}

export function setCachedCapture(url: string, screenshots: string[]): void {
  if (!screenshots.length) return;
  captureCache.set(normalizeUrl(url), { screenshots, at: now() });
}

// ─── Result cache ───────────────────────────────────────────────────

export interface CachedAnalysis {
  result: GoalAnalysisResult;
  journeySteps: JourneyStep[];
  endedReason: string;
  understanding?: SiteUnderstanding;
}

interface ResultEntry extends CachedAnalysis {
  at: number;
}

const resultCache = new Map<string, ResultEntry>();

export function resultKey(
  goalId: GoalId,
  customGoal: string,
  scope: "page" | "journey",
  url: string
): string {
  return `${goalId}|${customGoal}|${scope}|${normalizeUrl(url)}`;
}

export function getCachedResult(key: string): CachedAnalysis | undefined {
  const entry = resultCache.get(key);
  if (!entry) return undefined;
  if (now() - entry.at > RESULT_TTL_MS) {
    resultCache.delete(key);
    return undefined;
  }
  return { result: entry.result, journeySteps: entry.journeySteps, endedReason: entry.endedReason };
}

export function setCachedResult(key: string, value: CachedAnalysis): void {
  resultCache.set(key, { ...value, at: now() });
}

// ─── Site-understanding cache (per origin) ──────────────────────────

interface UnderstandingEntry {
  understanding: SiteUnderstanding;
  at: number;
}

const understandingCache = new Map<string, UnderstandingEntry>();

function originKey(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export function getCachedUnderstanding(url: string): SiteUnderstanding | undefined {
  const entry = understandingCache.get(originKey(url));
  if (!entry) return undefined;
  if (now() - entry.at > UNDERSTANDING_TTL_MS) {
    understandingCache.delete(originKey(url));
    return undefined;
  }
  return entry.understanding;
}

export function setCachedUnderstanding(url: string, understanding: SiteUnderstanding): void {
  understandingCache.set(originKey(url), { understanding, at: now() });
}

// ─── Invalidation ───────────────────────────────────────────────────

/** Drop everything — called on a fresh standard scan so data isn't stale. */
export function clearGoalCaches(): void {
  captureCache.clear();
  resultCache.clear();
  understandingCache.clear();
}
