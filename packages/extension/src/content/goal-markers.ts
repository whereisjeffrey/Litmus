/**
 * On-page friction markers — numbered pins placed over each issue's element,
 * with a hover tooltip describing what to change. Rendered in the page by the
 * content script; positions are document-relative so they stay glued to their
 * element as the user scrolls.
 */

import type { GoalMarker } from "@placeholder/shared";

const CONTAINER_ID = "placeholder-goal-markers";

const SEVERITY_COLOR: Record<string, string> = {
  blocker: "#DC2626",
  major: "#D97706",
  minor: "#6B7280",
};

let resizeHandler: (() => void) | null = null;

function pageRect(el: Element): { top: number; left: number; width: number; height: number } | null {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
  };
}

export function showGoalMarkers(markers: GoalMarker[]): void {
  clearGoalMarkers();

  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.style.cssText =
    "position:absolute;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none;";

  const placed: { marker: GoalMarker; el: Element; pin: HTMLElement }[] = [];

  markers.forEach((marker, i) => {
    const el = document.querySelector(marker.selector);
    if (!el) return;
    const rect = pageRect(el);
    if (!rect) return;

    const color = SEVERITY_COLOR[marker.severity] || SEVERITY_COLOR.minor;

    const pin = document.createElement("div");
    pin.style.cssText = `position:absolute;pointer-events:auto;width:26px;height:26px;border-radius:50%;background:${color};color:#fff;font:600 13px/26px -apple-system,system-ui,sans-serif;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;cursor:help;transition:transform .12s;`;
    pin.textContent = String(i + 1);

    const tip = document.createElement("div");
    tip.style.cssText =
      "position:absolute;left:32px;top:0;width:240px;background:#111827;color:#fff;font:400 13px/1.4 -apple-system,system-ui,sans-serif;padding:10px 12px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.35);display:none;z-index:1;";
    tip.innerHTML =
      `<div style="font-weight:600;margin-bottom:4px;">${escapeHtml(marker.title)}</div>` +
      `<div style="color:#D1D5DB;">${escapeHtml(marker.summary)}</div>`;
    pin.appendChild(tip);

    pin.addEventListener("mouseenter", () => {
      tip.style.display = "block";
      pin.style.transform = "scale(1.15)";
      // Flip tooltip left if it would overflow the right edge.
      const tr = tip.getBoundingClientRect();
      tip.style.left = tr.right > window.innerWidth ? "-248px" : "32px";
    });
    pin.addEventListener("mouseleave", () => {
      tip.style.display = "none";
      pin.style.transform = "scale(1)";
    });

    position(pin, rect);
    container.appendChild(pin);
    placed.push({ marker, el, pin });
  });

  document.body.appendChild(container);

  // Reposition on resize / layout shifts (scroll is handled by absolute coords).
  resizeHandler = () => {
    for (const p of placed) {
      const rect = pageRect(p.el);
      if (rect) position(p.pin, rect);
    }
  };
  window.addEventListener("resize", resizeHandler);
  // Re-sync once after late layout (lazy images, fonts).
  setTimeout(() => resizeHandler?.(), 600);
}

function position(pin: HTMLElement, rect: { top: number; left: number; width: number }): void {
  pin.style.top = `${rect.top - 8}px`;
  pin.style.left = `${rect.left + rect.width - 14}px`;
}

export function clearGoalMarkers(): void {
  document.getElementById(CONTAINER_ID)?.remove();
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
}

function escapeHtml(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
