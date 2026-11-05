import type { ExtensionMessage } from "@placeholder/shared";
import { installErrorHooks } from "./scanner/console-capture";
import { runFullScan } from "./scanner/index";
import { collectGoalSignals } from "./scanner/goals/collect-signals";
import { showGoalMarkers, clearGoalMarkers } from "./goal-markers";
import { showElement, hideElement } from "./highlighter";
import { setMobileViewport, setDesktopViewport } from "./viewport-simulator";

/**
 * Install error hooks immediately so we capture any runtime errors
 * that happen before the user clicks "Analyze".
 */
installErrorHooks();

/**
 * Listen for scan commands from the service worker (relayed from the side panel).
 */
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "START_SCAN") {
      performScan();
      sendResponse({ status: "scanning" });
    }
    if (message.type === "SHOW_ELEMENT") {
      try {
        console.log("[Placeholder] Show Me triggered for:", message.selector);
        const found = document.querySelector(message.selector);
        console.log("[Placeholder] Element found:", !!found, found);
        showElement(message.selector, message.title, message.description);
        sendResponse({ status: "shown", found: !!found });
      } catch (err) {
        console.error("[Placeholder] Show Me error:", err);
        sendResponse({ status: "error", error: String(err) });
      }
    }
    if (message.type === "HIDE_ELEMENT") {
      hideElement();
      sendResponse({ status: "hidden" });
    }
    if (message.type === "SET_VIEWPORT") {
      if (message.mode === "mobile") {
        setMobileViewport();
      } else {
        setDesktopViewport();
      }
      sendResponse({ status: "viewport_set", mode: message.mode });
    }
    if (message.type === "COLLECT_GOAL_SIGNALS") {
      try {
        const { signals, anchors, navCandidates, entry } = collectGoalSignals(message.goalId);
        // Broadcast (Phase 2 single-page path) and also respond directly
        // (Phase 3 journey orchestration awaits this response).
        chrome.runtime.sendMessage({
          type: "GOAL_SIGNALS_RESULT",
          goalId: message.goalId,
          signals,
          anchors,
          navCandidates,
          entry,
        } satisfies ExtensionMessage);
        sendResponse({ status: "collected", signals, anchors, navCandidates, entry });
      } catch (err) {
        console.error("[Placeholder] Goal signal collection failed:", err);
        sendResponse({ status: "error", error: String(err) });
      }
    }
    if (message.type === "CLICK_ELEMENT") {
      sendResponse(clickElement(message.selector));
    }
    if (message.type === "GET_PAGE_METRICS") {
      sendResponse({
        scrollHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
      });
    }
    if (message.type === "SCROLL_TO") {
      window.scrollTo({ top: message.y, behavior: "instant" as ScrollBehavior });
      sendResponse({ ok: true });
    }
    if (message.type === "GET_ELEMENT_RECT") {
      sendResponse(getElementRect(message.selector));
    }
    if (message.type === "SHOW_GOAL_MARKERS") {
      try {
        showGoalMarkers(message.markers);
        sendResponse({ status: "shown", count: message.markers.length });
      } catch (err) {
        sendResponse({ status: "error", error: String(err) });
      }
    }
    if (message.type === "CLEAR_GOAL_MARKERS") {
      clearGoalMarkers();
      sendResponse({ status: "cleared" });
    }
    return true; // keep message channel open for async responses
  }
);

/** Scroll an element into view and report its viewport rect for thumbnail cropping. */
function getElementRect(selector: string): {
  ok: boolean;
  rect?: { x: number; y: number; width: number; height: number };
  dpr?: number;
  viewportW?: number;
  viewportH?: number;
} {
  try {
    const el = document.querySelector(selector);
    if (!el) return { ok: false };
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    return {
      ok: true,
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      dpr: window.devicePixelRatio || 1,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Safety denylist — the journey engine must never trigger an irreversible or
 * destructive action. We refuse to click anything that commits a payment,
 * submits an order, or deletes/logs out. The engine navigates UP TO the
 * conversion point and stops; it never completes it.
 */
const UNSAFE_CLICK = /\b(pay( now)?|place order|complete (order|purchase)|confirm (order|purchase|payment)|submit (order|payment)|buy now|delete|remove|log ?out|sign ?out|unsubscribe|cancel( order| subscription)?)\b/i;

function clickElement(selector: string): { ok: boolean; refused?: boolean; reason?: string; clickedText?: string } {
  try {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return { ok: false, reason: "Element not found" };
    const text = (el.textContent || (el as HTMLInputElement).value || el.getAttribute("aria-label") || "").trim();
    if (UNSAFE_CLICK.test(text)) {
      return { ok: false, refused: true, reason: `Refused for safety: "${text}"`, clickedText: text };
    }
    el.scrollIntoView({ block: "center" });
    el.click();
    return { ok: true, clickedText: text };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

async function performScan(): Promise<void> {
  try {
    const result = await runFullScan((message, percent) => {
      chrome.runtime.sendMessage({
        type: "SCAN_PROGRESS",
        message,
        percent,
      } satisfies ExtensionMessage);
    });

    chrome.runtime.sendMessage({
      type: "SCAN_COMPLETE",
      result,
    } satisfies ExtensionMessage);
  } catch (err) {
    chrome.runtime.sendMessage({
      type: "SCAN_ERROR",
      error: err instanceof Error ? err.message : "Unknown scan error",
    } satisfies ExtensionMessage);
  }
}
