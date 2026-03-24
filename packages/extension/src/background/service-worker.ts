import type { ExtensionMessage } from "@placeholder/shared";

/**
 * Set the side panel to be available on all pages.
 */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

/**
 * Relay messages between the side panel and content scripts.
 *
 * Messages from the side panel (no sender.tab) get forwarded to the active tab's content script.
 * Messages from content scripts (have sender.tab) get forwarded to the side panel via runtime.sendMessage.
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    // Message from the side panel → forward to content script
    if (message.type === "START_SCAN" && !sender.tab) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, message).catch(() => {
            // Content script might not be injected yet
            chrome.runtime.sendMessage({
              type: "SCAN_ERROR",
              error: "Could not connect to page. Try refreshing the page and scanning again.",
            } satisfies ExtensionMessage).catch(() => {});
          });
        }
      });
      sendResponse({ status: "forwarded" });
      return true;
    }

    // Message from content script → forward to side panel (and any other extension pages)
    if (
      sender.tab &&
      (message.type === "SCAN_PROGRESS" ||
        message.type === "SCAN_COMPLETE" ||
        message.type === "SCAN_ERROR")
    ) {
      chrome.runtime.sendMessage(message).catch(() => {
        // Side panel might not be open; swallow
      });
    }

    return false;
  }
);
