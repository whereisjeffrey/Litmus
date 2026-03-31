import type { Finding } from "@placeholder/shared";
import { getReliableSelector } from "./selector-utils";

const SCANNER_UX = "ux-heuristics";
const SCANNER_FORMS = "ux-heuristics-forms";
const SCANNER_A11Y = "ux-heuristics-a11y";
const SCANNER_CONTENT = "ux-heuristics-content";

/**
 * Runs multiple UX heuristic checks against the current page DOM.
 * Each check is wrapped in try/catch so one failure doesn't break the rest.
 */
export function checkUXHeuristics(): { findings: Finding[] } {
  const findings: Finding[] = [];

  const checks: Array<() => void> = [
    () => checkNavItemCount(findings),
    () => checkCTATextQuality(findings),
    () => checkHeroCarousel(findings),
    () => checkStickyHeader(findings),
    () => checkSocialProof(findings),
    () => checkAutoPlayingMedia(findings),
    () => checkCopyrightYear(findings),
    () => checkSkipToContent(findings),
    () => checkReadingTime(findings),
    () => checkPasswordToggle(findings),
    () => checkFormFieldCount(findings),
    () => checkSocialLogin(findings),
    () => checkEmptyState(findings),
    () => checkPriceDisplay(findings),
    () => checkMobileViewport(findings),
  ];

  for (const check of checks) {
    try {
      check();
    } catch (err) {
      console.warn("[Placeholder] UX heuristic check failed:", err);
    }
  }

  return { findings };
}

// ── 1. Navigation Item Count ──────────────────────────────────────────

function checkNavItemCount(findings: Finding[]): void {
  const navs = document.querySelectorAll("nav");
  for (const nav of navs) {
    const topLevelItems = nav.querySelectorAll(":scope > a, :scope > li, :scope > ul > li, :scope > ol > li");
    if (topLevelItems.length > 7) {
      findings.push({
        id: "ux-nav-item-count",
        scanner: SCANNER_UX,
        severity: "warning",
        title: "Too many nav items",
        description: `Navigation has ${topLevelItems.length} top-level items. Hick's Law suggests more than 7 options slows decision-making. Consider grouping or prioritizing items.`,
        selector: getReliableSelector(nav),
        standard: "Hick's Law",
      });
    }
  }
}

// ── 2. CTA Text Quality ──────────────────────────────────────────────

const GENERIC_CTA_TEXTS = new Set([
  "submit",
  "click here",
  "learn more",
  "read more",
  "go",
  "send",
]);

function checkCTATextQuality(findings: Finding[]): void {
  const buttons = document.querySelectorAll(
    'button, a[role="button"], input[type="submit"]'
  );
  for (const btn of buttons) {
    const text =
      btn instanceof HTMLInputElement
        ? (btn.value || "").trim()
        : (btn.textContent || "").trim();
    if (text && GENERIC_CTA_TEXTS.has(text.toLowerCase())) {
      findings.push({
        id: "ux-generic-cta",
        scanner: SCANNER_UX,
        severity: "warning",
        title: "Generic CTA text",
        description: `"${text}" is vague. Use action-specific text that tells users what will happen, e.g. "Create account" or "Download report".`,
        selector: getReliableSelector(btn),
        standard: null,
      });
    }
  }
}

// ── 3. Hero Carousel Detection ────────────────────────────────────────

function checkHeroCarousel(findings: Finding[]): void {
  const carouselSelectors = [
    '[class*="carousel"]',
    '[class*="slider"]',
    '[class*="swiper"]',
    '[class*="slick"]',
    "[data-carousel]",
  ];
  const selector = carouselSelectors.join(", ");
  const elements = document.querySelectorAll(selector);

  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.top < 600) {
      findings.push({
        id: "ux-hero-carousel",
        scanner: SCANNER_UX,
        severity: "warning",
        title: "Hero uses carousel",
        description:
          "Carousels in the hero area have low engagement — most users only see the first slide. Consider a single, focused message instead.",
        selector: getReliableSelector(el),
        standard: null,
      });
      break; // one finding is enough
    }
  }
}

// ── 4. Sticky Header Detection ────────────────────────────────────────

function checkStickyHeader(findings: Finding[]): void {
  const pageHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;

  if (pageHeight < viewportHeight * 2) return; // only flag on long pages

  const candidates = [
    document.querySelector("header"),
    document.querySelector("nav"),
  ].filter(Boolean) as Element[];

  for (const el of candidates) {
    const style = window.getComputedStyle(el);
    if (style.position === "sticky" || style.position === "fixed") {
      return; // found a sticky header, all good
    }
  }

  findings.push({
    id: "ux-no-sticky-header",
    scanner: SCANNER_UX,
    severity: "info",
    title: "No sticky header",
    description:
      "This page is taller than 2 viewports but has no sticky/fixed header. A sticky header improves navigation on long pages.",
    selector: null,
    standard: null,
  });
}

// ── 5. Social Proof Detection ─────────────────────────────────────────

function checkSocialProof(findings: Finding[]): void {
  const pageHeight = document.documentElement.scrollHeight;
  const topHalfThreshold = pageHeight / 2;

  // Check for testimonial/review elements
  const proofSelectors = [
    '[class*="testimonial"]',
    '[class*="review"]',
    '[class*="quote"]',
    "blockquote",
  ];
  const proofEls = document.querySelectorAll(proofSelectors.join(", "));
  for (const el of proofEls) {
    const rect = el.getBoundingClientRect();
    const absTop = rect.top + window.scrollY;
    if (absTop < topHalfThreshold) return; // found social proof
  }

  // Check for logo bars
  const logoContainers = document.querySelectorAll(
    '[class*="logo"], [class*="client"], [class*="partner"], [class*="trusted"]'
  );
  for (const container of logoContainers) {
    const imgs = container.querySelectorAll("img");
    if (imgs.length >= 2) return; // found a logo bar
  }

  findings.push({
    id: "ux-no-social-proof",
    scanner: SCANNER_UX,
    severity: "info",
    title: "No social proof found",
    description:
      "No testimonials, reviews, or client logo bars detected. Social proof builds trust and can increase conversions.",
    selector: null,
    standard: null,
  });
}

// ── 6. Auto-Playing Media ─────────────────────────────────────────────

function checkAutoPlayingMedia(findings: Finding[]): void {
  const autoplayMedia = document.querySelectorAll(
    "video[autoplay], audio[autoplay]"
  );
  for (const el of autoplayMedia) {
    const isMuted = el.hasAttribute("muted");
    findings.push({
      id: "ux-autoplay-media",
      scanner: SCANNER_UX,
      severity: "warning",
      title: "Auto-playing media",
      description: isMuted
        ? "Auto-playing media detected (muted). While muted autoplay is less disruptive, it can still distract users or consume bandwidth."
        : "Auto-playing media with sound detected. This is disruptive and violates WCAG 1.4.2. Users should control when media plays.",
      selector: getReliableSelector(el),
      standard: isMuted ? null : "WCAG 1.4.2",
    });
  }
}

// ── 7. Copyright Year Check ───────────────────────────────────────────

function checkCopyrightYear(findings: Finding[]): void {
  const footer = document.querySelector("footer");
  if (!footer) return;

  const text = footer.textContent || "";
  const yearMatch = text.match(/(?:©|copyright)\s*(\d{4})/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year !== 2026) {
      findings.push({
        id: "ux-outdated-copyright",
        scanner: SCANNER_A11Y,
        severity: "info",
        title: "Outdated copyright year",
        description: `Footer shows copyright year ${year}. Outdated years can make a site appear unmaintained. Consider updating to 2026 or using a dynamic year.`,
        selector: getReliableSelector(footer),
        standard: null,
      });
    }
  }
}

// ── 8. Skip to Content Link ───────────────────────────────────────────

function checkSkipToContent(findings: Finding[]): void {
  const firstLink = document.querySelector("body a");
  if (firstLink) {
    const text = (firstLink.textContent || "").toLowerCase();
    const href = firstLink.getAttribute("href") || "";
    if (text.includes("skip") && href.startsWith("#")) {
      return; // skip link found
    }
  }

  findings.push({
    id: "ux-no-skip-link",
    scanner: SCANNER_A11Y,
    severity: "warning",
    title: "No skip-to-content link",
    description:
      'The first focusable element is not a "skip to content" link. Keyboard and screen reader users need this to bypass repeated navigation.',
    selector: null,
    standard: "WCAG 2.4.1",
  });
}

// ── 9. Reading Time Estimation ────────────────────────────────────────

function checkReadingTime(findings: Finding[]): void {
  const article = document.querySelector("article");
  if (!article) {
    // Check for long-form text content
    const bodyText = document.body.textContent || "";
    const wordCount = bodyText.trim().split(/\s+/).length;
    if (wordCount < 500) return; // not a long-form page
  }

  // Look for reading time indicators anywhere on the page
  const pageText = document.body.textContent || "";
  if (
    /\bmin\s*read\b/i.test(pageText) ||
    /\bminute\s*read\b/i.test(pageText) ||
    /\breading\s*time\b/i.test(pageText)
  ) {
    return; // reading time indicator found
  }

  // Only flag if we detected an article or long content
  if (article) {
    findings.push({
      id: "ux-no-reading-time",
      scanner: SCANNER_CONTENT,
      severity: "info",
      title: "No reading time shown",
      description:
        "This appears to be an article but no reading time indicator was found. Showing estimated reading time helps users decide whether to commit to reading.",
      selector: getReliableSelector(article),
      standard: null,
    });
  }
}

// ── 10. Password Field Toggle ─────────────────────────────────────────

function checkPasswordToggle(findings: Finding[]): void {
  const passwordFields = document.querySelectorAll('input[type="password"]');
  for (const field of passwordFields) {
    const parent = field.parentElement;
    if (!parent) continue;

    // Look for toggle button in parent or nearby siblings
    const toggleSelectors = [
      '[class*="toggle"]',
      '[class*="show"]',
      '[class*="eye"]',
      '[class*="reveal"]',
      '[aria-label*="show password" i]',
      '[aria-label*="toggle" i]',
      '[aria-label*="reveal" i]',
    ];
    const toggle = parent.querySelector(toggleSelectors.join(", "));
    if (toggle) continue;

    // Also check grandparent
    const grandparent = parent.parentElement;
    if (grandparent) {
      const toggle2 = grandparent.querySelector(toggleSelectors.join(", "));
      if (toggle2) continue;
    }

    findings.push({
      id: "ux-no-password-toggle",
      scanner: SCANNER_FORMS,
      severity: "warning",
      title: "No password toggle",
      description:
        "Password field has no visible show/hide toggle. A toggle reduces errors and frustration, especially on mobile.",
      selector: getReliableSelector(field),
      standard: null,
    });
  }
}

// ── 11. Form Field Count on Signup/Login ──────────────────────────────

function isSignupPage(): boolean {
  const url = window.location.href.toLowerCase();
  if (/signup|register|join/.test(url)) return true;
  const forms = document.querySelectorAll("form");
  for (const form of forms) {
    const hasPassword = form.querySelector('input[type="password"]');
    const hasEmail = form.querySelector(
      'input[type="email"], input[name*="email" i]'
    );
    const hasName = form.querySelector(
      'input[name*="name" i], input[autocomplete*="name"]'
    );
    if (hasPassword && hasEmail && hasName) return true;
  }
  return false;
}

function isLoginPage(): boolean {
  const url = window.location.href.toLowerCase();
  if (/login|signin|sign-in/.test(url)) return true;
  const forms = document.querySelectorAll("form");
  for (const form of forms) {
    const hasPassword = form.querySelector('input[type="password"]');
    const hasEmail = form.querySelector(
      'input[type="email"], input[name*="email" i]'
    );
    const visibleInputs = form.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])'
    );
    if (hasPassword && hasEmail && visibleInputs.length <= 3) return true;
  }
  return false;
}

function checkFormFieldCount(findings: Finding[]): void {
  const forms = document.querySelectorAll("form");

  for (const form of forms) {
    const visibleInputs = form.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), select, textarea'
    );

    if (isSignupPage() && visibleInputs.length > 4) {
      findings.push({
        id: "ux-too-many-signup-fields",
        scanner: SCANNER_FORMS,
        severity: "warning",
        title: "Too many signup fields",
        description: `Signup form has ${visibleInputs.length} fields. Reducing to 4 or fewer can significantly improve completion rates. Consider collecting additional info after signup.`,
        selector: getReliableSelector(form),
        standard: null,
      });
    } else if (isLoginPage() && !isSignupPage() && visibleInputs.length > 3) {
      findings.push({
        id: "ux-too-many-login-fields",
        scanner: SCANNER_FORMS,
        severity: "warning",
        title: "Too many login fields",
        description: `Login form has ${visibleInputs.length} fields. Login should typically need only email and password (plus an optional "remember me").`,
        selector: getReliableSelector(form),
        standard: null,
      });
    }
  }
}

// ── 12. Social Login Detection ────────────────────────────────────────

function checkSocialLogin(findings: Finding[]): void {
  if (!isSignupPage() && !isLoginPage()) return;

  const socialPatterns =
    /google|apple|github|facebook|microsoft|social|oauth|sso/i;

  const buttons = document.querySelectorAll("button, a");
  for (const btn of buttons) {
    const text = (btn.textContent || "").trim();
    const ariaLabel = btn.getAttribute("aria-label") || "";
    const className =
      typeof btn.className === "string" ? btn.className : "";
    if (
      socialPatterns.test(text) ||
      socialPatterns.test(ariaLabel) ||
      socialPatterns.test(className)
    ) {
      return; // social login found
    }
  }

  findings.push({
    id: "ux-no-social-login",
    scanner: SCANNER_FORMS,
    severity: "info",
    title: "No social login option",
    description:
      "No social login buttons detected (Google, Apple, GitHub, etc.). Social login can reduce signup friction and increase conversion rates.",
    selector: null,
    standard: null,
  });
}

// ── 13. Empty State Detection ─────────────────────────────────────────

function checkEmptyState(findings: Finding[]): void {
  const url = window.location.href.toLowerCase();
  if (!/dashboard|app|admin|console/.test(url)) return;

  const emptyStateSelectors = [
    '[class*="empty"]',
    '[class*="no-data"]',
    '[class*="placeholder"]',
    '[class*="zero-state"]',
  ];
  const emptyEls = document.querySelectorAll(emptyStateSelectors.join(", "));

  for (const el of emptyEls) {
    const text = (el.textContent || "").toLowerCase();
    if (
      text.includes("no items") ||
      text.includes("get started") ||
      text.includes("nothing here") ||
      el.matches('[class*="empty"], [class*="no-data"], [class*="zero-state"]')
    ) {
      // Check if there's a CTA within the empty state
      const cta = el.querySelector("a, button");
      if (!cta) {
        findings.push({
          id: "ux-empty-state-no-action",
          scanner: SCANNER_CONTENT,
          severity: "warning",
          title: "Empty state has no action",
          description:
            "An empty state was detected without a call-to-action. Empty states should guide users to their next step with a clear action button.",
          selector: getReliableSelector(el),
          standard: null,
        });
      }
      break; // one finding is enough
    }
  }

  // Also check by text content if no class-based match
  if (emptyEls.length === 0) {
    const allElements = document.querySelectorAll("main p, main div, main h2, main h3");
    for (const el of allElements) {
      const text = (el.textContent || "").trim().toLowerCase();
      if (
        text === "no items" ||
        text === "nothing here" ||
        text === "no data" ||
        text === "get started"
      ) {
        const parent = el.parentElement;
        const cta = parent?.querySelector("a, button");
        if (!cta) {
          findings.push({
            id: "ux-empty-state-no-action",
            scanner: SCANNER_CONTENT,
            severity: "warning",
            title: "Empty state has no action",
            description:
              "An empty state was detected without a call-to-action. Empty states should guide users to their next step with a clear action button.",
            selector: getReliableSelector(el),
            standard: null,
          });
        }
        break;
      }
    }
  }
}

// ── 14. Price Display Check ───────────────────────────────────────────

function checkPriceDisplay(findings: Finding[]): void {
  const url = window.location.href.toLowerCase();
  if (!/pricing|plans/.test(url)) return;

  // Check for price-like text
  const allText = document.body.textContent || "";
  const hasPrices =
    /\$\d|€\d|\/mo|\/month|\/year|\/yr/i.test(allText);
  if (!hasPrices) return;

  // Check for a highlighted/recommended plan
  const highlightSelectors = [
    '[class*="popular"]',
    '[class*="recommended"]',
    '[class*="featured"]',
    '[class*="highlighted"]',
  ];
  const highlighted = document.querySelector(highlightSelectors.join(", "));

  if (!highlighted) {
    // Also check for "Most Popular" badge text
    const allElements = document.querySelectorAll("span, div, p, badge");
    let found = false;
    for (const el of allElements) {
      const text = (el.textContent || "").trim().toLowerCase();
      if (text === "most popular" || text === "recommended" || text === "best value") {
        found = true;
        break;
      }
    }
    if (!found) {
      findings.push({
        id: "ux-no-highlighted-plan",
        scanner: SCANNER_UX,
        severity: "warning",
        title: "No highlighted plan",
        description:
          "Pricing page has no visually highlighted or recommended plan. Anchoring users to a recommended option reduces decision fatigue and increases conversions.",
        selector: null,
        standard: null,
      });
    }
  }
}

// ── 15. Mobile Viewport Check ─────────────────────────────────────────

function checkMobileViewport(findings: Finding[]): void {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return; // meta-checker handles missing viewport

  const content = (viewport.getAttribute("content") || "").toLowerCase();
  if (
    content.includes("maximum-scale=1") ||
    content.includes("user-scalable=no") ||
    content.includes("user-scalable=0")
  ) {
    findings.push({
      id: "ux-viewport-blocks-zoom",
      scanner: SCANNER_A11Y,
      severity: "critical",
      title: "Viewport blocks zoom",
      description:
        'The viewport meta tag restricts pinch-to-zoom. This is an accessibility violation — users with low vision rely on zoom. Remove "maximum-scale=1" and "user-scalable=no".',
      selector: null,
      standard: "WCAG 1.4.4",
    });
  }
}
