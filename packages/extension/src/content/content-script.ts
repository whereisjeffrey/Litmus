import type { ExtensionMessage } from "@placeholder/shared";
import { installErrorHooks } from "./scanner/console-capture";
import { runFullScan } from "./scanner/index";

/**
 * Install error hooks immediately so we capture any runtime errors
 * that happen before the user clicks "Analyze".
 */
installErrorHooks();

/**
 * Listen for scan commands from the service worker (relayed from the side panel).
 */
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, _sendResponse) => {
    if (message.type === "START_SCAN") {
      performScan();
    }
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
