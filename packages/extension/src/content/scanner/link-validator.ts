import type { LinkInfo, LinkResult, Finding } from "@placeholder/shared";

/**
 * Generates a proper selector for a link element.
 */
function getLinkSelector(a: HTMLAnchorElement, index: number): string {
  if (a.id) return `#${CSS.escape(a.id)}`;
  const parent = a.parentElement;
  if (parent) {
    const siblings = Array.from(parent.querySelectorAll("a"));
    if (siblings.length > 1) {
      const idx = siblings.indexOf(a) + 1;
      if (parent.id) {
        return `#${CSS.escape(parent.id)} > a:nth-of-type(${idx})`;
      }
    }
  }
  return `a:nth-of-type(${index + 1})`;
}

/**
 * Collects all links on the page, categorizes them, and flags issues.
 * Actual HTTP status checking is deferred to Phase 2 (content scripts can't
 * make arbitrary cross-origin fetches). Here we detect structural problems:
 * empty hrefs, javascript: links, anchor-only links, and missing link text.
 *
 * Features:
 * - Categorizes links: internal vs external
 * - Detects anchor links pointing to non-existent IDs
 * - Flags javascript:void(0) links
 * - Detects links with no text content AND no aria-label (invisible links)
 * - Handles mailto: and tel: links separately (not flagged as broken)
 */
export function validateLinks(): LinkResult {
  const anchors = document.querySelectorAll("a");
  const links: LinkInfo[] = [];
  const findings: Finding[] = [];
  let placeholderLinks = 0;
  let emptyLinks = 0;

  anchors.forEach((a, index) => {
    const href = a.getAttribute("href") ?? "";
    const text = (a.textContent || "").trim();
    const selector = getLinkSelector(a, index);

    // Protocol links: mailto:, tel:, sms:, etc.
    const isProtocolLink = /^(mailto|tel|sms|fax|geo|callto):/.test(href);

    const isPlaceholder =
      href === "#" ||
      href === "" ||
      href.startsWith("javascript:") ||
      href === "#!" ||
      href === "/#";

    const isExternal =
      href.startsWith("http") &&
      !href.startsWith(window.location.origin);

    // Check for broken anchor links (href="#something" where ID doesn't exist)
    let isBrokenAnchor = false;
    if (
      href.startsWith("#") &&
      href.length > 1 &&
      href !== "#!" &&
      !href.startsWith("#/") // Skip hash-router paths
    ) {
      const targetId = href.slice(1);
      try {
        const targetEl = document.getElementById(targetId);
        if (!targetEl) {
          isBrokenAnchor = true;
        }
      } catch {
        // Invalid ID selector — treat as broken
        isBrokenAnchor = true;
      }
    }

    if (isPlaceholder) placeholderLinks++;
    if (href === "") emptyLinks++;

    links.push({
      href,
      text: text.slice(0, 100),
      selector,
      isExternal,
      statusCode: null,
      isBroken: null,
      isPlaceholder,
      isProtocolLink,
      isBrokenAnchor,
    });

    // Flag empty href
    if (href === "") {
      findings.push({
        id: `link-empty-${index}`,
        scanner: "link-validator",
        severity: "warning",
        title: "Link with empty href",
        description: `A link element has no href attribute value. Text: "${text.slice(0, 50) || "(no text)"}"`,
        selector,
        standard: null,
      });
    }

    // Flag javascript: void links
    if (href.startsWith("javascript:")) {
      findings.push({
        id: `link-js-${index}`,
        scanner: "link-validator",
        severity: "warning",
        title: "Link uses javascript: protocol",
        description: `Links should use real URLs or buttons instead of javascript: hrefs. Text: "${text.slice(0, 50) || "(no text)"}"`,
        selector,
        standard: null,
      });
    }

    // Flag broken anchor links
    if (isBrokenAnchor) {
      findings.push({
        id: `link-broken-anchor-${index}`,
        scanner: "link-validator",
        severity: "warning",
        title: "Anchor link points to non-existent ID",
        description: `Link with href="${href}" points to an element with id="${href.slice(1)}" which does not exist on this page.`,
        selector,
        standard: null,
      });
    }

    // Flag links with no accessible text
    const ariaLabel = a.getAttribute("aria-label") || "";
    const ariaLabelledBy = a.getAttribute("aria-labelledby") || "";
    const title = a.getAttribute("title") || "";
    const imgAlt = a.querySelector("img")?.getAttribute("alt") || "";
    const svgTitle = a.querySelector("svg title")?.textContent || "";

    if (!text && !ariaLabel && !ariaLabelledBy && !title && !imgAlt && !svgTitle) {
      findings.push({
        id: `link-notext-${index}`,
        scanner: "link-validator",
        severity: "critical",
        title: "Link has no accessible text",
        description:
          "This link has no text content, aria-label, title, or image alt text. Screen readers cannot describe its purpose.",
        selector,
        standard: "WCAG 2.4.4",
      });
    }

    // Flag generic link text
    const genericTexts = [
      "click here",
      "here",
      "read more",
      "more",
      "learn more",
      "link",
    ];
    if (genericTexts.includes(text.toLowerCase())) {
      findings.push({
        id: `link-generic-${index}`,
        scanner: "link-validator",
        severity: "info",
        title: "Link has generic text",
        description: `"${text}" is not descriptive. Links should clearly describe their destination.`,
        selector,
        standard: "WCAG 2.4.4",
      });
    }

    // Flag links that open in new window without warning
    const target = a.getAttribute("target");
    if (target === "_blank") {
      const hasNewWindowWarning =
        ariaLabel.toLowerCase().includes("new window") ||
        ariaLabel.toLowerCase().includes("new tab") ||
        title.toLowerCase().includes("new window") ||
        title.toLowerCase().includes("new tab") ||
        text.toLowerCase().includes("new window") ||
        text.toLowerCase().includes("new tab") ||
        !!a.querySelector('[aria-hidden]'); // common icon pattern
      if (!hasNewWindowWarning) {
        findings.push({
          id: `link-newwindow-${index}`,
          scanner: "link-validator",
          severity: "info",
          title: "Link opens in new window without warning",
          description: `Link "${text.slice(0, 40) || "(no text)"}" uses target="_blank" but does not indicate it opens in a new window/tab.`,
          selector,
          standard: "WCAG 3.2.5",
        });
      }
    }
  });

  return {
    links,
    totalLinks: links.length,
    placeholderLinks,
    emptyLinks,
    findings,
  };
}
