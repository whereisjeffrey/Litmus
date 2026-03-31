import type { ContrastPair, ContrastResult, Finding } from "@placeholder/shared";
import {
  CONTRAST_RATIO_AA_NORMAL,
  CONTRAST_RATIO_AA_LARGE,
  LARGE_TEXT_PX,
  LARGE_TEXT_BOLD_PX,
} from "@placeholder/shared";

/**
 * Parses a CSS color string (rgb, rgba, hsl, hsla, hex, named) into [r, g, b, a].
 * Falls back to getComputedStyle for CSS variables and named colors.
 */
function parseColor(color: string): [number, number, number, number] {
  // Handle rgb/rgba
  const rgbMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
      rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    ];
  }

  // Handle hsl/hsla
  const hslMatch = color.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1;
    const [r, g, b] = hslToRgb(h, s, l);
    return [r, g, b, a];
  }

  // Handle hex colors (#rgb, #rrggbb, #rrggbbaa)
  const hexMatch = color.match(
    /^#([0-9a-f]{3,8})$/i
  );
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        1,
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        1,
      ];
    }
    if (hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(6, 8), 16) / 255,
      ];
    }
  }

  // Handle "transparent"
  if (color === "transparent") {
    return [0, 0, 0, 0];
  }

  // Fallback: use an offscreen element to resolve named colors / CSS vars
  // getComputedStyle already resolves CSS variables before we get here,
  // so this mainly handles named colors like "red", "navy", etc.
  try {
    const temp = document.createElement("div");
    temp.style.color = color;
    temp.style.display = "none";
    document.body.appendChild(temp);
    const resolved = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    if (resolved !== color) {
      return parseColor(resolved);
    }
  } catch {
    // ignore
  }

  return [0, 0, 0, 1];
}

/**
 * Converts HSL to RGB. h, s, l are in [0, 1].
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Blends a foreground color with alpha over a background color.
 */
function alphaBlend(
  fg: [number, number, number, number],
  bg: [number, number, number, number]
): [number, number, number] {
  const a = fg[3];
  return [
    Math.round(fg[0] * a + bg[0] * (1 - a)),
    Math.round(fg[1] * a + bg[1] * (1 - a)),
    Math.round(fg[2] * a + bg[2] * (1 - a)),
  ];
}

/**
 * Computes the relative luminance of an sRGB color per WCAG 2.x.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes the WCAG contrast ratio between two luminance values.
 * Returns a value between 1 and 21.
 */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Detects if an element or its ancestors have a background image or gradient.
 */
function hasComplexBackground(el: Element): boolean {
  let current: Element | null = el;
  while (current) {
    const style = window.getComputedStyle(current);
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== "none") {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

/**
 * Walks up the DOM tree to find the effective background color,
 * compositing semi-transparent layers along the way.
 * Handles transparent backgrounds by continuing up the tree.
 */
function getEffectiveBackgroundColor(el: Element): [number, number, number] {
  let bg: [number, number, number] = [255, 255, 255]; // default white
  const layers: [number, number, number, number][] = [];
  let current: Element | null = el;

  while (current) {
    const style = window.getComputedStyle(current);
    const parsed = parseColor(style.backgroundColor);
    if (parsed[3] > 0) {
      layers.unshift(parsed);
    }
    current = current.parentElement;
  }

  // Composite from bottom (white) up
  for (const layer of layers) {
    bg = alphaBlend(layer, [bg[0], bg[1], bg[2], 1]);
  }

  return bg;
}

/**
 * Generates a proper unique selector for an element.
 */
function getSelectorForElement(el: Element, index: number): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (s) => s.tagName === el.tagName
    );
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el) + 1;
      return `${el.tagName.toLowerCase()}:nth-of-type(${idx})`;
    }
  }
  return `${el.tagName.toLowerCase()}.contrast-${index}`;
}

/**
 * Checks text contrast across the page for WCAG AA compliance.
 * Samples visible text-bearing elements and computes actual contrast ratios.
 *
 * Handles:
 * - rgba/hsla/hex colors
 * - CSS variables (resolved by getComputedStyle)
 * - Background color inheritance (walks up DOM)
 * - Background images/gradients (flagged as "unable to determine")
 * - Transparent backgrounds composited over ancestors
 * - Large text detection: 18px regular or 14px bold (ratio drops to 3:1)
 */
export function checkContrast(): ContrastResult {
  const TEXT_TAGS = [
    "p",
    "span",
    "a",
    "li",
    "td",
    "th",
    "label",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "button",
    "strong",
    "em",
    "small",
    "blockquote",
    "figcaption",
    "dt",
    "dd",
    "div",
    "summary",
    "legend",
    "caption",
  ];

  const selector = TEXT_TAGS.join(",");
  const elements = document.querySelectorAll(selector);
  const pairs: ContrastPair[] = [];
  const findings: Finding[] = [];
  const checked = new Set<string>();
  const MAX_PAIRS = 500;

  elements.forEach((el, index) => {
    if (pairs.length >= MAX_PAIRS) return;

    // Only check elements with direct text content
    const text = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() || "")
      .join("")
      .trim();

    if (!text) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (style.opacity === "0") return;

    // Deduplicate by color combination + font size
    const dedupeKey = `${style.color}|${style.backgroundColor}|${style.fontSize}|${style.fontWeight}`;
    if (checked.has(dedupeKey) && checked.size > 200) return;
    checked.add(dedupeKey);

    const complexBg = hasComplexBackground(el);
    const fgParsed = parseColor(style.color);
    const bgRgb = getEffectiveBackgroundColor(el);
    const fgRgb = alphaBlend(fgParsed, [bgRgb[0], bgRgb[1], bgRgb[2], 1]);

    const fgLum = relativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
    const bgLum = relativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
    const ratio = contrastRatio(fgLum, bgLum);

    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLargeText =
      fontSize >= LARGE_TEXT_PX ||
      (fontSize >= LARGE_TEXT_BOLD_PX && fontWeight >= 700);
    const requiredRatio = isLargeText
      ? CONTRAST_RATIO_AA_LARGE
      : CONTRAST_RATIO_AA_NORMAL;
    const passes = ratio >= requiredRatio;

    const uniqueSelector = getSelectorForElement(el, index);

    pairs.push({
      selector: uniqueSelector,
      textColor: style.color,
      backgroundColor: `rgb(${bgRgb[0]}, ${bgRgb[1]}, ${bgRgb[2]})`,
      contrastRatio: Math.round(ratio * 100) / 100,
      fontSize,
      fontWeight,
      isLargeText,
      requiredRatio,
      passes: complexBg ? true : passes, // Don't fail if we can't determine bg
      textSnippet: text.slice(0, 60),
      hasComplexBackground: complexBg,
    });

    if (complexBg && !passes) {
      // Flag as unable to determine rather than a hard fail
      findings.push({
        id: `contrast-complex-bg-${pairs.length}`,
        scanner: "contrast-checker",
        severity: "info",
        title: `Contrast unknown (bg image)`,
        description: `Text "${text.slice(0, 40)}..." has a background image or gradient. Manual review recommended to ensure ${requiredRatio}:1 contrast ratio.`,
        selector: uniqueSelector,
        standard: "WCAG 1.4.3",
      });
    } else if (!passes) {
      findings.push({
        id: `contrast-fail-${pairs.length}`,
        scanner: "contrast-checker",
        severity: ratio < 2.5 ? "critical" : "warning",
        title: `Low contrast ratio (${Math.round(ratio * 100) / 100}:1)`,
        description: `Text "${text.slice(0, 40)}..." has a contrast ratio of ${Math.round(ratio * 100) / 100}:1. ${isLargeText ? "Large text" : "Normal text"} requires at least ${requiredRatio}:1 for WCAG AA.`,
        selector: uniqueSelector,
        standard: "WCAG 1.4.3",
      });
    }
  });

  return {
    pairs,
    passingCount: pairs.filter((p) => p.passes).length,
    failingCount: pairs.filter((p) => !p.passes).length,
    findings,
  };
}
