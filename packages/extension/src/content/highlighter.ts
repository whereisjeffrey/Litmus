/**
 * Element highlighter for the "Show Me" feature.
 * Injects styles and overlay elements into the host page to highlight
 * elements referenced by scan findings.
 *
 * Uses inline styles and a namespaced <style> tag to avoid conflicts
 * with the host page's styles. All DOM nodes use a unique prefix.
 */

const PREFIX = "__litmus_hl";
const STYLE_ID = `${PREFIX}_style`;
const OVERLAY_ID = `${PREFIX}_overlay`;
const TOOLTIP_ID = `${PREFIX}_tooltip`;

let isActive = false;
let dismissHandler: ((e: MouseEvent) => void) | null = null;
let resizeHandler: (() => void) | null = null;
let scrollHandler: (() => void) | null = null;
let currentTarget: Element | null = null;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ${PREFIX}_pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    #${OVERLAY_ID} {
      position: fixed !important;
      pointer-events: none !important;
      z-index: 2147483646 !important;
      border: 2px dashed #ef4444 !important;
      background: rgba(239, 68, 68, 0.08) !important;
      animation: ${PREFIX}_pulse 1.5s ease-in-out infinite !important;
      box-sizing: border-box !important;
      border-radius: 3px !important;
      transition: top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease !important;
    }
    #${TOOLTIP_ID} {
      position: fixed !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      max-width: 320px !important;
      padding: 10px 14px !important;
      background: #1e1e2e !important;
      color: #f5f5f5 !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      line-height: 1.4 !important;
    }
    #${TOOLTIP_ID} .${PREFIX}_title {
      font-size: 13px !important;
      font-weight: 600 !important;
      margin: 0 0 4px 0 !important;
      color: #f5f5f5 !important;
    }
    #${TOOLTIP_ID} .${PREFIX}_desc {
      font-size: 11px !important;
      font-weight: 400 !important;
      margin: 0 !important;
      color: #a0a0b0 !important;
    }
  `;
  document.head.appendChild(style);
}

function positionOverlay(el: Element): void {
  const overlay = document.getElementById(OVERLAY_ID);
  const tooltip = document.getElementById(TOOLTIP_ID);
  if (!overlay) return;

  const rect = el.getBoundingClientRect();
  const pad = 3;

  overlay.style.top = `${rect.top - pad}px`;
  overlay.style.left = `${rect.left - pad}px`;
  overlay.style.width = `${rect.width + pad * 2}px`;
  overlay.style.height = `${rect.height + pad * 2}px`;

  if (tooltip) {
    // Position tooltip below the element, or above if not enough space below
    const tooltipHeight = 70; // approximate
    const gap = 8;
    let top = rect.bottom + gap;
    if (top + tooltipHeight > window.innerHeight) {
      top = rect.top - tooltipHeight - gap;
    }
    if (top < 0) top = 8;

    let left = rect.left;
    if (left + 320 > window.innerWidth) {
      left = window.innerWidth - 330;
    }
    if (left < 8) left = 8;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }
}

function safeQuerySelector(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    // Selector might have invalid characters — try escaping or fallback
    try {
      // Try just the tag + first class if the full selector is broken
      const parts = selector.split(" > ");
      const last = parts[parts.length - 1];
      if (last) return document.querySelector(last);
    } catch {
      // Give up
    }
    return null;
  }
}

export function showElement(selector: string, title: string, description: string): void {
  // Always clean up any previous highlight first
  hideElement();

  injectStyles();

  const el = safeQuerySelector(selector);
  if (!el) {
    // Element not found — nothing to highlight
    return;
  }

  currentTarget = el;

  // Scroll into view first, then position overlay after scroll completes
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

  // Wait for scroll animation to finish before positioning overlay
  setTimeout(() => {
    // Re-scroll in case the first one didn't fully complete
    el.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    document.body.appendChild(overlay);

    // Create tooltip
    const tooltip = document.createElement("div");
    tooltip.id = TOOLTIP_ID;

    const titleEl = document.createElement("p");
    titleEl.className = `${PREFIX}_title`;
    titleEl.textContent = title;

    const descEl = document.createElement("p");
    descEl.className = `${PREFIX}_desc`;
    // Truncate long descriptions
    const shortDesc = description.length > 150 ? description.slice(0, 147) + "..." : description;
    descEl.textContent = shortDesc;

    tooltip.appendChild(titleEl);
    tooltip.appendChild(descEl);
    document.body.appendChild(tooltip);

    positionOverlay(el);
    isActive = true;

    // Click-anywhere-to-dismiss (delayed so the triggering message doesn't immediately dismiss)
    setTimeout(() => {
      dismissHandler = (_e: MouseEvent) => {
        hideElement();
      };
      document.addEventListener("click", dismissHandler, { once: true, capture: true });
    }, 100);

    // Reposition on scroll/resize
    resizeHandler = () => {
      if (currentTarget) positionOverlay(currentTarget);
    };
    scrollHandler = resizeHandler;
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("scroll", scrollHandler, true);
  }, 600);
}

export function hideElement(): void {
  const overlay = document.getElementById(OVERLAY_ID);
  const tooltip = document.getElementById(TOOLTIP_ID);

  if (overlay) overlay.remove();
  if (tooltip) tooltip.remove();

  if (dismissHandler) {
    document.removeEventListener("click", dismissHandler, { capture: true });
    dismissHandler = null;
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler, true);
    scrollHandler = null;
  }

  currentTarget = null;
  isActive = false;
}
