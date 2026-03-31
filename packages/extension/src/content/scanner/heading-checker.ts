import type { HeadingInfo, HeadingResult, Finding } from "@placeholder/shared";
import { getReliableSelector } from "./selector-utils";

/**
 * Checks if an element is visually hidden.
 */
function isHiddenElement(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none") return true;
  if (style.visibility === "hidden") return true;
  if (style.opacity === "0") return true;
  // Common SR-only / visually-hidden patterns
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return true;
  if (
    style.position === "absolute" &&
    (style.clip === "rect(0px, 0px, 0px, 0px)" ||
      style.clip === "rect(1px, 1px, 1px, 1px)" ||
      style.clipPath === "inset(50%)")
  ) {
    return true;
  }
  return false;
}

/**
 * Checks if an element has aria-hidden="true" on itself or an ancestor.
 */
function isAriaHidden(el: Element): boolean {
  let current: Element | null = el;
  while (current) {
    if (current.getAttribute("aria-hidden") === "true") return true;
    current = current.parentElement;
  }
  return false;
}

/**
 * Generates a proper selector for a heading element.
 */
function getHeadingSelector(el: Element, _index: number): string {
  return getReliableSelector(el);
}

/**
 * Detects non-heading elements that are visually styled like headings
 * (large bold text that arguably should be a semantic heading).
 */
function findFakeHeadings(): Finding[] {
  const findings: Finding[] = [];
  // Check divs, spans, and paragraphs with large bold text
  const candidates = document.querySelectorAll("div, span, p, strong, b");
  let fakeHeadingCount = 0;
  const MAX_FAKE_HEADING_CHECKS = 500;

  for (let i = 0; i < candidates.length && i < MAX_FAKE_HEADING_CHECKS; i++) {
    const el = candidates[i];
    // Skip if inside a heading already
    if (el.closest("h1, h2, h3, h4, h5, h6")) continue;

    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;

    // Check direct text content only (not nested element text)
    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim() || "")
      .join("")
      .trim();

    if (!directText || directText.length > 200) continue;

    // Heuristic: large (>= 20px) AND bold (>= 700) text that is short-ish
    // and occupies its own line (block display)
    const isBlock = style.display === "block" || style.display === "flex";
    if (fontSize >= 20 && fontWeight >= 700 && isBlock && directText.length < 120) {
      fakeHeadingCount++;
      if (fakeHeadingCount <= 5) {
        // Limit to avoid noise
        findings.push({
          id: `heading-fake-${fakeHeadingCount}`,
          scanner: "heading-checker",
          severity: "info",
          title: "Possible fake heading",
          description: `"${directText.slice(0, 50)}" is a <${el.tagName.toLowerCase()}> with ${fontSize}px bold text. Consider using a semantic heading element (h1-h6) for better accessibility and SEO.`,
          selector: getHeadingSelector(el, i),
          standard: "WCAG 1.3.1",
        });
      }
    }
  }

  return findings;
}

/**
 * Validates heading hierarchy (H1-H6) for proper document structure.
 * Checks:
 * - Missing H1, multiple H1s, skipped heading levels, empty headings
 * - Visually hidden headings (display:none, visibility:hidden, aria-hidden)
 * - Non-heading elements styled as headings
 */
export function checkHeadings(): HeadingResult {
  const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const headings: HeadingInfo[] = [];
  const findings: Finding[] = [];
  const skippedLevels: [number, number][] = [];

  headingElements.forEach((el, index) => {
    const level = parseInt(el.tagName.charAt(1), 10);
    const text = (el.textContent || "").trim();
    const selector = getHeadingSelector(el, index);
    const hidden = isHiddenElement(el);
    const ariaHid = isAriaHidden(el);

    headings.push({
      level,
      text: text.slice(0, 120),
      selector,
      isHidden: hidden,
      isAriaHidden: ariaHid,
    });

    // Empty heading
    if (!text) {
      findings.push({
        id: `heading-empty-${headings.length}`,
        scanner: "heading-checker",
        severity: "warning",
        title: "Empty heading",
        description:
          "This heading has no text content. Empty headings confuse screen readers and break document outline.",
        selector,
        standard: "WCAG 1.3.1",
      });
    }

    // Hidden heading that is not aria-hidden (confusing for screen readers)
    if (hidden && !ariaHid && text) {
      findings.push({
        id: `heading-hidden-${headings.length}`,
        scanner: "heading-checker",
        severity: "info",
        title: "Hidden heading",
        description: `Heading "${text.slice(0, 50)}" is visually hidden via CSS but still present in the accessibility tree. This may be intentional (for screen readers) but verify it's correct.`,
        selector,
        standard: "WCAG 1.3.1",
      });
    }

    // Heading inside aria-hidden (invisible to screen readers, breaks document outline)
    if (ariaHid && text) {
      findings.push({
        id: `heading-ariahidden-${headings.length}`,
        scanner: "heading-checker",
        severity: "warning",
        title: "Hidden aria heading",
        description: `Heading "${text.slice(0, 50)}" is inside an aria-hidden region. This heading won't appear in the document outline for screen reader users, potentially breaking navigation.`,
        selector,
        standard: "WCAG 1.3.1",
      });
    }
  });

  // Only consider visible headings for hierarchy checks
  const visibleHeadings = headings.filter((h) => !h.isAriaHidden);

  // No H1
  const h1Count = visibleHeadings.filter((h) => h.level === 1).length;
  const hasH1 = h1Count > 0;
  const multipleH1s = h1Count > 1;

  if (!hasH1) {
    findings.push({
      id: "heading-no-h1",
      scanner: "heading-checker",
      severity: "critical",
      title: "No H1 heading",
      description:
        "Every page should have exactly one H1 that describes the page topic. This is essential for screen readers and SEO.",
      selector: null,
      standard: "WCAG 1.3.1",
    });
  }

  // Multiple H1s — warning, not critical (some frameworks like React use this)
  // Downgrade to info on blog/article pages where CMSes commonly do this
  if (multipleH1s) {
    const isBlogOrArticle = !!(
      document.querySelector("article") ||
      document.querySelector("[itemtype*='Article']") ||
      document.querySelector("[itemtype*='BlogPosting']") ||
      document.querySelector('meta[property="og:type"][content="article"]')
    );
    findings.push({
      id: "heading-multiple-h1",
      scanner: "heading-checker",
      severity: isBlogOrArticle ? "info" : "warning",
      title: "Multiple H1s",
      description: isBlogOrArticle
        ? "Multiple H1s detected on a blog/article page. Many CMSes do this intentionally with sectioning elements."
        : "Best practice is to have a single H1 per page. Multiple H1s can dilute the document structure, but some frameworks (React, sectioning elements) may use them intentionally.",
      selector: null,
      standard: "WCAG 1.3.1",
    });
  }

  // Check for skipped levels (only visible headings)
  let previousLevel = 0;
  for (const heading of visibleHeadings) {
    if (previousLevel > 0 && heading.level > previousLevel + 1) {
      const skip: [number, number] = [previousLevel, heading.level];
      skippedLevels.push(skip);

      findings.push({
        id: `heading-skip-${previousLevel}-${heading.level}-${skippedLevels.length}`,
        scanner: "heading-checker",
        severity: "warning",
        title: "Skipped heading level",
        description: `"${heading.text.slice(0, 50)}" is an <h${heading.level}> but the previous heading was <h${previousLevel}>. This skips ${heading.level - previousLevel - 1} level(s), breaking the document outline.`,
        selector: heading.selector,
        standard: "WCAG 1.3.1",
      });
    }
    previousLevel = heading.level;
  }

  // First heading is not H1 — only flag if it's in main content area (not sidebar/nav)
  if (visibleHeadings.length > 0 && visibleHeadings[0].level !== 1) {
    // Find the actual DOM element for the first heading to check its context
    const firstHeadingSelector = visibleHeadings[0].selector;
    let isInSidebarOrNav = false;
    if (firstHeadingSelector) {
      try {
        const firstHeadingEl = document.querySelector(firstHeadingSelector);
        if (firstHeadingEl) {
          isInSidebarOrNav = !!(
            firstHeadingEl.closest("nav") ||
            firstHeadingEl.closest("aside") ||
            firstHeadingEl.closest("[role='navigation']") ||
            firstHeadingEl.closest("[role='complementary']")
          );
        }
      } catch {
        // Invalid selector — skip context check
      }
    }
    if (!isInSidebarOrNav) {
      findings.push({
        id: "heading-first-not-h1",
        scanner: "heading-checker",
        severity: "info",
        title: "First heading not H1",
        description:
          "The first heading on the page should typically be an H1. Starting with a lower level heading may indicate a structural issue.",
        selector: visibleHeadings[0].selector,
        standard: "WCAG 1.3.1",
      });
    }
  }

  // Detect non-heading elements styled as headings
  const fakeHeadingFindings = findFakeHeadings();
  findings.push(...fakeHeadingFindings);

  return { headings, hasH1, multipleH1s, skippedLevels, findings };
}
