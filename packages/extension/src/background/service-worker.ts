import type { ExtensionMessage } from "@placeholder/shared";

/**
 * Opens the side panel when the extension action icon is clicked.
 */
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

/**
 * Relay messages between the side panel and content scripts.
 * The side panel sends START_SCAN, this forwards it to the active tab's content script.
 * The content script sends progress/complete/error messages back, relayed to the side panel.
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    if (message.type === "START_SCAN") {
      // Forward to the content script in the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId !== undefined) {
          chrome.tabs.sendMessage(tabId, message);
        }
      });
      sendResponse({ status: "forwarded" });
      return true;
    }

    if (
      message.type === "SCAN_PROGRESS" ||
      message.type === "SCAN_COMPLETE" ||
      message.type === "SCAN_ERROR"
    ) {
      // These come from the content script — broadcast to all extension pages (side panel)
      chrome.runtime.sendMessage(message).catch(() => {
        // Side panel might not be open; swallow the error
      });
    }

    return false;
  }
);

/**
 * Set the side panel to be available on all pages.
 */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
