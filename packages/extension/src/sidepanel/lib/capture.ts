/**
 * Full-page screenshot capture for the side panel.
 *
 * `chrome.tabs.captureVisibleTab` only grabs the visible viewport, so to let
 * Claude "see" a whole long page we scroll it in viewport-sized steps and
 * capture each slice. The content script does the scrolling; the service
 * worker does the capture; this orchestrates from the panel.
 */

import type { ExtensionMessage, PageMetrics } from "@placeholder/shared";
import { apiClient } from "./api-client";

const SETTLE_MS = 550; // > captureVisibleTab rate limit (~2/sec) + render time

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

/**
 * Capture the full scrollable page as an ordered array of JPEG data URLs
 * (top → bottom). Falls back to a single viewport shot on any error.
 */
export async function captureFullPage(tabId: number, maxShots = 6): Promise<string[]> {
  try {
    const metrics = await sendToTab<PageMetrics>(tabId, { type: "GET_PAGE_METRICS" });
    const total = Math.max(metrics.scrollHeight, metrics.innerHeight);
    const steps = Math.min(Math.ceil(total / metrics.innerHeight), maxShots);

    const shots: string[] = [];
    for (let i = 0; i < steps; i++) {
      await sendToTab(tabId, { type: "SCROLL_TO", y: i * metrics.innerHeight });
      await delay(SETTLE_MS);
      const shot = await apiClient.captureScreenshot();
      if (shot) shots.push(shot);
    }
    // Restore scroll position.
    await sendToTab(tabId, { type: "SCROLL_TO", y: 0 }).catch(() => {});
    return shots.length ? shots : await singleShot();
  } catch {
    return singleShot();
  }
}

async function singleShot(): Promise<string[]> {
  const shot = await apiClient.captureScreenshot();
  return shot ? [shot] : [];
}
