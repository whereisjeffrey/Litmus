import type {
  TouchTargetInfo,
  TouchTargetResult,
  Finding,
} from "@placeholder/shared";
import { MIN_TOUCH_TARGET_PX } from "@placeholder/shared";
import { getReliableSelector } from "./selector-utils";

/** Minimum spacing between touch targets in px — 4px is fine in most contexts */
const MIN_TOUCH_TARGET_SPACING = 4;

/**
 * Gets the effective clickable rect of an element, accounting for padding.
 */
function getClickableRect(el: Element): DOMRect {
  // getBoundingClientRect already includes padding and border (the full box),
  // which IS the clickable area. This is correct as-is.
  return el.getBoundingClientRect();
}

/**
 * Computes the minimum distance between two DOMRects (edge-to-edge).
 * Returns 0 if they overlap.
 */
function rectDistance(a: DOMRect, b: DOMRect): number {
  const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right));
  const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom));
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generates a unique selector for an interactive element.
 */
function getTargetSelector(el: Element, _index: number): string {
  return getReliableSelector(el);
}

/**
 * Checks all interactive elements for minimum touch target size (44x44px)
 * and sufficient spacing between adjacent targets.
 *
 * WCAG 2.5.8 (Level AA) requires interactive targets to be at least 24x24px,
 * but 44x44px is the recommended minimum for good mobile UX (Apple/Google HIG).
 *
 * Also checks spacing between targets — two 44px buttons 2px apart is still
 * a problem for mobile users.
 */
export function checkTouchTargets(): TouchTargetResult {
  // Only flag touch targets if the page appears to be mobile-optimized (has viewport meta tag)
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    // Desktop-only site — don't flag touch target issues
    return { targets: [], failingCount: 0, findings: [] };
  }

  const INTERACTIVE_SELECTORS = [
    "a[href]",
    "button",
    'input:not([type="hidden"])',
    "select",
    "textarea",
    '[role="button"]',
    '[role="link"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="checkbox"]',
    '[role="radio"]',
    "[tabindex]",
    "[onclick]",
  ].join(",");

  const elements = document.querySelectorAll(INTERACTIVE_SELECTORS);
  const targets: TouchTargetInfo[] = [];
  const findings: Finding[] = [];
  let failingCount = 0;

  // Collect all visible interactive elements and their rects
  interface TargetEntry {
    el: Element;
    rect: DOMRect;
    index: number;
    text: string;
    selector: string;
  }
  const visibleTargets: TargetEntry[] = [];

  elements.forEach((el, index) => {
    const rect = getClickableRect(el);

    // Skip hidden elements (display:none, visibility:hidden, opacity:0)
    if (rect.width === 0 || rect.height === 0) return;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (style.opacity === "0") return;
    // Skip elements fully off-screen
    if (rect.right < 0 || rect.bottom < 0) return;

    // Skip elements with tabindex="-1" (not user-focusable)
    const tabindex = el.getAttribute("tabindex");
    if (tabindex && parseInt(tabindex, 10) < 0) return;

    const text = (el.textContent || "").trim().slice(0, 60);
    const selector = getTargetSelector(el, index);

    visibleTargets.push({ el, rect, index, text, selector });
  });

  // Check size and spacing
  for (let i = 0; i < visibleTargets.length; i++) {
    const { rect, text, selector, index } = visibleTargets[i];
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    const meetsMinimum =
      width >= MIN_TOUCH_TARGET_PX && height >= MIN_TOUCH_TARGET_PX;

    // Find nearest neighbor distance (only check nearby elements for performance)
    let minSpacing: number | null = null;
    const MAX_NEIGHBOR_CHECK = 50;
    const start = Math.max(0, i - MAX_NEIGHBOR_CHECK);
    const end = Math.min(visibleTargets.length, i + MAX_NEIGHBOR_CHECK);

    for (let j = start; j < end; j++) {
      if (j === i) continue;
      const otherRect = visibleTargets[j].rect;
      // Quick bounds check — skip if clearly far apart
      if (
        Math.abs(rect.top - otherRect.top) > 200 &&
        Math.abs(rect.left - otherRect.left) > 200
      ) {
        continue;
      }
      const dist = rectDistance(rect, otherRect);
      if (minSpacing === null || dist < minSpacing) {
        minSpacing = dist;
      }
    }

    const hasSufficientSpacing =
      minSpacing === null || minSpacing >= MIN_TOUCH_TARGET_SPACING;

    targets.push({
      selector,
      tagName: visibleTargets[i].el.tagName.toLowerCase(),
      text,
      width,
      height,
      meetsMinimum,
      spacingToNearest: minSpacing !== null ? Math.round(minSpacing * 10) / 10 : null,
      hasSufficientSpacing,
    });

    if (!meetsMinimum) {
      failingCount++;
      const dimension =
        width < MIN_TOUCH_TARGET_PX && height < MIN_TOUCH_TARGET_PX
          ? `${width}x${height}px`
          : width < MIN_TOUCH_TARGET_PX
            ? `${width}px wide`
            : `${height}px tall`;

      findings.push({
        id: `touch-small-${index}`,
        scanner: "touch-targets",
        severity: "warning",
        title: "Small touch target",
        description: `"${text || visibleTargets[i].el.tagName.toLowerCase()}" is ${dimension}, below the ${MIN_TOUCH_TARGET_PX}x${MIN_TOUCH_TARGET_PX}px recommended minimum. Small targets are hard to tap on mobile.`,
        selector,
        standard: "WCAG 2.5.8",
      });
    }

    // Check spacing — even well-sized targets are problematic if too close together
    if (!hasSufficientSpacing && minSpacing !== null) {
      findings.push({
        id: `touch-spacing-${index}`,
        scanner: "touch-targets",
        severity: "warning",
        title: "Targets too close",
        description: `"${text || visibleTargets[i].el.tagName.toLowerCase()}" is only ${Math.round(minSpacing)}px from the nearest interactive element. Recommend at least ${MIN_TOUCH_TARGET_SPACING}px spacing to prevent accidental taps.`,
        selector,
        standard: "WCAG 2.5.8",
      });
    }
  }

  return { targets, failingCount, findings };
}
