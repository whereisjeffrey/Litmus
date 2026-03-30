import type { ExtensionMessage } from "@placeholder/shared";
import { installErrorHooks } from "./scanner/console-capture";
import { runFullScan } from "./scanner/index";
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
        showElement(message.selector, message.title, message.description);
        sendResponse({ status: "shown" });
      } catch (err) {
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
    return true; // keep message channel open for async responses
  }
);

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
