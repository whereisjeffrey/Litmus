import type { CrawledElement, CrawlResult } from "@placeholder/shared";

const SCAN_TIMEOUT_MS = 5000;

/**
 * Generates a unique CSS selector for an element.
 */
function getSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((c) => `.${CSS.escape(c)}`)
        .join("");
      selector += classes;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (s) => s.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

/**
 * Checks whether an element is visible (not hidden via CSS or zero-size).
 */
function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (style.opacity === "0") return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  // Check if element is clipped off-screen (common SR-only pattern)
  if (
    rect.right < 0 ||
    rect.bottom < 0 ||
    rect.left > window.innerWidth ||
    rect.top > window.innerHeight * 3 // allow some scrollable content
  ) {
    return false;
  }
  return true;
}

/**
 * Crawl elements from a single root (document.body or shadow root).
 */
function crawlRoot(
  root: Element | ShadowRoot,
  elements: CrawledElement[],
  maxElements: number,
  deadline: number,
  inShadowDOM: boolean,
  iframeOrigin: string | null
): void {
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "LINK",
    "META",
    "HEAD",
    "BR",
    "HR",
  ]);

  const walkRoot = root instanceof ShadowRoot ? root : root;
  const walker = document.createTreeWalker(
    walkRoot,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        const el = node as Element;
        if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        // Skip deep SVG children but keep the <svg> itself
        if (
          el.tagName !== "SVG" &&
          el.closest("svg") &&
          el.parentElement?.tagName !== "BODY"
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node: Node | null = walker.nextNode();

  while (node && elements.length < maxElements) {
    // Timeout check every 100 elements
    if (elements.length % 100 === 0 && Date.now() > deadline) {
      return;
    }

    // Safety: skip non-Element nodes
    if (!(node instanceof Element)) {
      node = walker.nextNode();
      continue;
    }

    const el = node;
    const visible = isVisible(el);

    // Still record the element but mark visibility
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const attrs: Record<string, string> = {};
    for (const attr of el.attributes) {
      attrs[attr.name] = attr.value;
    }

    elements.push({
      tagName: el.tagName.toLowerCase(),
      textContent: (el.textContent || "").trim().slice(0, 200),
      attributes: attrs,
      computedStyles: {
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
      },
      boundingRect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      childrenCount: el.children.length,
      selector: getSelector(el),
      isVisible: visible,
      inShadowDOM,
      iframeOrigin,
    });

    // Recurse into shadow DOM
    if (el.shadowRoot) {
      crawlRoot(
        el.shadowRoot,
        elements,
        maxElements,
        deadline,
        true,
        iframeOrigin
      );
    }

    node = walker.nextNode();
  }
}

/**
 * Attempts to crawl same-origin iframes. Cross-origin iframes are skipped.
 */
function crawlIframes(
  elements: CrawledElement[],
  maxElements: number,
  deadline: number
): void {
  const iframes = document.querySelectorAll("iframe");

  for (const iframe of iframes) {
    if (elements.length >= maxElements || Date.now() > deadline) return;

    let iframeDoc: Document;
    try {
      // This will throw for cross-origin iframes
      iframeDoc = iframe.contentDocument!;
      if (!iframeDoc || !iframeDoc.body) continue;
    } catch {
      // Cross-origin iframe — skip gracefully
      continue;
    }

    const origin = iframe.src
      ? new URL(iframe.src, window.location.href).origin
      : window.location.origin;

    crawlRoot(
      iframeDoc.body,
      elements,
      maxElements,
      deadline,
      false,
      origin
    );
  }
}

/**
 * Walks the entire DOM tree and collects structured element data.
 * Skips <script>, <style>, <noscript>, <svg> internals, and hidden elements
 * to keep the result size manageable.
 *
 * Features:
 * - Timeout to prevent hanging on massive pages
 * - Shadow DOM traversal
 * - Same-origin iframe scanning
 * - Visibility state tracking
 */
export function crawlDOM(): CrawlResult {
  const MAX_ELEMENTS = 3000;
  const deadline = Date.now() + SCAN_TIMEOUT_MS;
  const elements: CrawledElement[] = [];

  // Crawl main document body
  crawlRoot(document.body, elements, MAX_ELEMENTS, deadline, false, null);

  // Crawl same-origin iframes
  crawlIframes(elements, MAX_ELEMENTS, deadline);

  return {
    url: window.location.href,
    title: document.title,
    elements,
    totalElements: document.body.querySelectorAll("*").length,
    timestamp: Date.now(),
  };
}
