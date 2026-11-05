/**
 * Element thumbnail capture — scrolls an issue's element into view, screenshots
 * the viewport, and crops to that element (with padding) so a friction card can
 * show "here's where this is" inside the panel.
 */

import type { ExtensionMessage, ElementRectResult } from "@placeholder/shared";
import { apiClient } from "./api-client";

const PAD = 16; // CSS px of context around the element

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

export async function captureElementThumbnail(tabId: number, selector: string): Promise<string | null> {
  try {
    const info = await sendToTab<ElementRectResult>(tabId, { type: "GET_ELEMENT_RECT", selector });
    if (!info.ok || !info.rect) return null;

    await delay(280); // scroll settle + captureVisibleTab rate limit
    const shot = await apiClient.captureScreenshot();
    if (!shot) return null;

    return await cropToElement(shot, info);
  } catch {
    return null;
  }
}

function cropToElement(dataUrl: string, info: ElementRectResult): Promise<string | null> {
  return new Promise((resolve) => {
    const dpr = info.dpr || 1;
    const r = info.rect!;
    const img = new Image();
    img.onload = () => {
      try {
        const sx = Math.max(0, (r.x - PAD) * dpr);
        const sy = Math.max(0, (r.y - PAD) * dpr);
        const sw = Math.min(img.width - sx, (r.width + PAD * 2) * dpr);
        const sh = Math.min(img.height - sy, (r.height + PAD * 2) * dpr);
        if (sw <= 0 || sh <= 0) return resolve(null);

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
