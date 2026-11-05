/**
 * Journey orchestration (Phase 3) — drives the inspected tab through a funnel
 * toward a goal, one click at a time, capturing each step.
 *
 * Runs in the side panel because the panel survives page navigations (the
 * content script is destroyed and recreated on every new page). The loop is:
 *   collect signals → ask the engine for the next click → click → wait for the
 *   new page → repeat, until the engine says "arrived"/"stuck" or we hit the
 *   depth cap. It never clicks a purchase/submit/destructive control — that
 *   guard lives in the content script (clickElement) and the engine prompt.
 */

import type {
  GoalId,
  GoalAnchor,
  JourneyStep,
  NavCandidate,
  PageType,
  ExtensionMessage,
  ClickElementResult,
} from "@placeholder/shared";
import { apiClient } from "./api-client";
import { captureFullPage } from "./capture";
import { getCachedCapture, setCachedCapture } from "./page-cache";

interface CollectResponse {
  status: string;
  signals: Record<string, string | number | boolean>;
  anchors: GoalAnchor[];
  navCandidates: NavCandidate[];
  entry: JourneyStep;
}

export interface JourneyOptions {
  goalId: GoalId;
  customGoal?: string;
  maxSteps?: number;
  fullPage?: boolean;
  onProgress?: (message: string, stepIndex: number) => void;
}

export interface JourneyOutcome {
  steps: JourneyStep[];
  entrySignals: Record<string, string | number | boolean>;
  /** Anchors on the final page, so "Show Me" works on what's currently shown. */
  lastAnchors: GoalAnchor[];
  /** Why the walk ended */
  endedReason: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function sendToTab<T = unknown>(tabId: number, message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (resp) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(resp as T);
    });
  });
}

async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

/** Collect signals, retrying until the content script is ready on a new page. */
async function collectWithRetry(tabId: number, goalId: GoalId): Promise<CollectResponse | null> {
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const resp = await sendToTab<CollectResponse>(tabId, { type: "COLLECT_GOAL_SIGNALS", goalId });
      if (resp && resp.status === "collected") return resp;
    } catch {
      // content script not injected yet — wait and retry
    }
    await delay(300);
  }
  return null;
}

/** Resolve when the tab finishes loading a new page, or after a timeout. */
function waitForNavigation(tabId: number, timeoutMs = 6000): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === "complete") finish();
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(finish, timeoutMs);
  });
}

export async function runJourney(opts: JourneyOptions): Promise<JourneyOutcome> {
  const maxSteps = opts.maxSteps ?? 5;
  const onProgress = opts.onProgress ?? (() => {});
  const steps: JourneyStep[] = [];
  const visited: string[] = [];
  let lastAnchors: GoalAnchor[] = [];
  let endedReason = "Reached the step limit.";

  const tabId = await getActiveTabId();
  if (tabId == null) return { steps, entrySignals: {}, lastAnchors, endedReason: "No active tab." };

  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex++) {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || "";
    if (!/^https?:/i.test(url)) {
      endedReason = "Page can't be analyzed (not a normal web page).";
      break;
    }

    onProgress(`Reading page ${stepIndex + 1}…`, stepIndex);
    const collected = await collectWithRetry(tabId, opts.goalId);
    if (!collected) {
      endedReason = "Couldn't read the page — try reloading it.";
      break;
    }
    lastAnchors = collected.anchors;

    // Reuse a recent full-page capture for this URL if we have one — capturing
    // scrolls the page and takes several shots, and it's identical per goal.
    let screenshots: string[];
    if (opts.fullPage) {
      const cached = getCachedCapture(url);
      if (cached) {
        onProgress(`Using saved capture for page ${stepIndex + 1}…`, stepIndex);
        screenshots = cached;
      } else {
        onProgress(`Capturing page ${stepIndex + 1}…`, stepIndex);
        screenshots = await captureFullPage(tabId);
        setCachedCapture(url, screenshots);
      }
    } else {
      onProgress(`Capturing page ${stepIndex + 1}…`, stepIndex);
      screenshots = await apiClient.captureScreenshot().then((s) => (s ? [s] : []));
    }

    steps.push({
      index: stepIndex,
      url,
      pageType: collected.entry.pageType as PageType,
      actionTaken: null,
      frictionPointIds: [],
      signals: collected.signals,
      screenshot: screenshots[0] ?? null,
      screenshots,
    });
    visited.push(url);

    if (stepIndex === maxSteps - 1) break;

    onProgress(`Deciding the next move…`, stepIndex);
    const decision = await apiClient.goalNextStep({
      goalId: opts.goalId,
      customGoal: opts.customGoal,
      url,
      signals: collected.signals,
      navCandidates: collected.navCandidates,
      screenshot: screenshots[0] ?? null,
      stepIndex,
      visited,
    });

    if (!decision || decision.decision !== "click" || !decision.candidateKey) {
      endedReason =
        decision?.decision === "arrived"
          ? `Arrived at the goal: ${decision.reason}`
          : decision?.reason || "No further step toward the goal.";
      break;
    }

    const cand = collected.navCandidates.find((c) => c.key === decision.candidateKey);
    if (!cand) {
      endedReason = "Next step was no longer available.";
      break;
    }

    steps[steps.length - 1].actionTaken = decision.actionLabel || `Clicked "${cand.text}"`;
    onProgress(`Clicking "${cand.text}"…`, stepIndex);

    let click: ClickElementResult | null = null;
    try {
      click = await sendToTab<ClickElementResult>(tabId, { type: "CLICK_ELEMENT", selector: cand.selector });
    } catch {
      click = null;
    }

    if (!click || !click.ok) {
      endedReason = click?.refused
        ? `Stopped safely before "${click.clickedText}" (no purchases/submits).`
        : "Couldn't click the next step.";
      break;
    }

    await waitForNavigation(tabId);
    await delay(800); // let the new page settle / SPA render
  }

  return { steps, entrySignals: steps[0]?.signals ?? {}, lastAnchors, endedReason };
}
