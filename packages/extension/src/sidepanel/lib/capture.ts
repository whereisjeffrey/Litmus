import type { ScrollToMessage, SetViewportMessage } from "@placeholder/shared";

/**
 * Full-page capture: scrolls the page viewport-by-viewport and captures each
 * segment via the service worker. Segments are returned top-to-bottom as
 * JPEG data URLs — sent to the AI as an ordered set rather than stitched,
 * which keeps each image at a resolution the model reads well.
 */

const MAX_SEGMENTS = 6; // caps payload size; Chrome also rate-limits captureVisibleTab
const CAPTURE_INTERVAL_MS = 600; // stay under Chrome's ~2 captures/sec limit

interface ScrollResponse {
  status: string;
  y: number;
  pageHeight: number;
  viewportHeight: number;
}

async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

// A content script from an older build may keep the message channel open
// without ever responding, which leaves the sendMessage promise pending
// forever. Every cross-context await goes through this so a stale or
// unresponsive listener degrades the capture instead of freezing the scan.
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function scrollTo(tabId: number, y: number): Promise<ScrollResponse | null> {
  try {
    const message: ScrollToMessage = { type: "SCROLL_TO", y };
    return await withTimeout(
      chrome.tabs.sendMessage(tabId, message) as Promise<ScrollResponse | null>,
      3000,
      null
    );
  } catch {
    return null;
  }
}

async function captureViewport(): Promise<string | null> {
  try {
    const response = await withTimeout(
      chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" }) as Promise<{
        dataUrl?: string | null;
      } | null>,
      5000,
      null
    );
    return response?.dataUrl || null;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Capture the full page as ordered viewport segments.
 * Falls back to a single-viewport capture if scrolling isn't possible.
 */
export async function captureFullPage(): Promise<string[]> {
  const tabId = await getActiveTabId();
  if (tabId === null) {
    const single = await captureViewport();
    return single ? [single] : [];
  }

  // Probe page metrics (and move to top)
  const probe = await scrollTo(tabId, 0);
  if (!probe) {
    const single = await captureViewport();
    return single ? [single] : [];
  }

  const { pageHeight, viewportHeight } = probe;
  const segmentCount = Math.min(
    MAX_SEGMENTS,
    Math.max(1, Math.ceil(pageHeight / Math.max(viewportHeight, 1)))
  );

  const segments: string[] = [];
  for (let i = 0; i < segmentCount; i++) {
    const targetY = Math.min(i * viewportHeight, Math.max(0, pageHeight - viewportHeight));
    await scrollTo(tabId, targetY);
    await sleep(CAPTURE_INTERVAL_MS);
    const shot = await captureViewport();
    if (shot) segments.push(shot);
    // If we've reached the bottom early (short page), stop
    if (targetY >= pageHeight - viewportHeight) break;
  }

  // Return the reader to the top of the page
  await scrollTo(tabId, 0);

  return segments;
}

async function setViewport(tabId: number, mode: "desktop" | "mobile"): Promise<boolean> {
  try {
    const message: SetViewportMessage = { type: "SET_VIEWPORT", mode };
    await withTimeout(chrome.tabs.sendMessage(tabId, message) as Promise<unknown>, 3000, null);
    return true;
  } catch {
    return false;
  }
}

export interface ViewportCaptures {
  /** Full-page desktop segments, top to bottom */
  desktop: string[];
  /** Simulated mobile-width (390px CSS constraint) segments, top to bottom */
  mobile: string[];
}

const MAX_MOBILE_SEGMENTS = 3;

/**
 * Capture desktop full-page segments plus a few segments in the simulated
 * mobile viewport (the CSS-constraint simulator — an approximation of
 * mobile, not device emulation; the AI prompt labels it as such).
 * Always restores the desktop viewport.
 */
export async function captureAllViewports(): Promise<ViewportCaptures> {
  const desktop = await captureFullPage();

  const tabId = await getActiveTabId();
  if (tabId === null) return { desktop, mobile: [] };

  const mobile: string[] = [];
  const switched = await setViewport(tabId, "mobile");
  if (switched) {
    try {
      await sleep(800); // let the constrained layout reflow
      const probe = await scrollTo(tabId, 0);
      const viewportHeight = probe?.viewportHeight ?? 800;
      const pageHeight = probe?.pageHeight ?? viewportHeight;
      const segmentCount = Math.min(
        MAX_MOBILE_SEGMENTS,
        Math.max(1, Math.ceil(pageHeight / Math.max(viewportHeight, 1)))
      );
      for (let i = 0; i < segmentCount; i++) {
        const targetY = Math.min(i * viewportHeight, Math.max(0, pageHeight - viewportHeight));
        await scrollTo(tabId, targetY);
        await sleep(CAPTURE_INTERVAL_MS);
        const shot = await captureViewport();
        if (shot) mobile.push(shot);
        if (targetY >= pageHeight - viewportHeight) break;
      }
    } finally {
      await setViewport(tabId, "desktop");
      await scrollTo(tabId, 0);
    }
  }

  return { desktop, mobile };
}
