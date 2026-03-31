import type { Finding } from "@placeholder/shared";
import { PageType } from "@placeholder/shared";
import { getReliableSelector } from "./selector-utils";

const SCANNER_NAME = "page-specific";

// ─── Helpers ──────────────────────────────────────────────────────────

function makeFinding(
  id: string,
  severity: Finding["severity"],
  title: string,
  description: string,
  selector: string | null = null,
  standard: string | null = null
): Finding {
  return { id, scanner: SCANNER_NAME, severity, title, description, selector, standard };
}

function isCTAElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (tag !== "a" && tag !== "button") return false;
  const cls = (el.className || "").toLowerCase();
  if (/cta|btn|button/.test(cls)) return true;
  // Check for styled links with bright backgrounds
  if (tag === "a") {
    try {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      // Non-transparent, non-white background suggests a styled CTA link
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && bg !== "rgb(255, 255, 255)") {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

// ─── Landing / Homepage Checks ────────────────────────────────────────

function checkCTAAboveFold(findings: Finding[]): void {
  try {
    const candidates = document.querySelectorAll("a, button");
    let ctaCount = 0;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 700 && rect.height > 0 && rect.width > 0 && isCTAElement(el)) {
        ctaCount++;
      }
    }
    if (ctaCount === 0) {
      findings.push(
        makeFinding("no-cta-above-fold", "critical", "No CTA above fold",
          "No call-to-action button or link was found within the first 700px of the page. Visitors may not know what action to take.")
      );
    }
  } catch { /* swallow */ }
}

function checkCompetingCTAs(findings: Finding[]): void {
  try {
    const candidates = document.querySelectorAll("a, button");
    let ctaCount = 0;
    let firstSelector: string | null = null;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 700 && rect.height > 0 && rect.width > 0 && isCTAElement(el)) {
        ctaCount++;
        if (!firstSelector) firstSelector = getReliableSelector(el);
      }
    }
    if (ctaCount > 2) {
      findings.push(
        makeFinding("competing-ctas", "warning", "Too many CTAs above fold",
          `Found ${ctaCount} competing CTAs above the fold. Too many calls-to-action can overwhelm visitors and reduce conversion.`,
          firstSelector)
      );
    }
  } catch { /* swallow */ }
}

function checkWallOfText(findings: Finding[]): void {
  try {
    const blocks = document.querySelectorAll("p, div");
    for (const el of blocks) {
      const text = el.textContent || "";
      if (text.length <= 300) continue;
      // Check if it has child headings, images, or lists that break up the text
      const hasBreak = el.querySelector("h1, h2, h3, h4, h5, h6, img, ul, ol, li, hr, br");
      if (!hasBreak) {
        findings.push(
          makeFinding("wall-of-text", "warning", "Wall of text detected",
            `A text block with ${text.length} characters was found with no visual breaks (headings, images, or lists). This can reduce readability.`,
            getReliableSelector(el))
        );
        // Only flag the first one to avoid noise
        break;
      }
    }
  } catch { /* swallow */ }
}

function checkFooterLinks(findings: Finding[]): void {
  try {
    const pageHeight = document.documentElement.scrollHeight;
    const footerThreshold = pageHeight - 300;
    const essentialKeywords = ["privacy", "terms", "contact", "about"];
    const links = document.querySelectorAll("a");
    const foundKeywords = new Set<string>();

    for (const link of links) {
      const rect = link.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      if (absoluteTop < footerThreshold) continue;
      const text = (link.textContent || "").toLowerCase();
      const href = (link.getAttribute("href") || "").toLowerCase();
      for (const kw of essentialKeywords) {
        if (text.includes(kw) || href.includes(kw)) {
          foundKeywords.add(kw);
        }
      }
    }

    // Also check <footer> element if it exists
    const footer = document.querySelector("footer");
    if (footer) {
      const footerLinks = footer.querySelectorAll("a");
      for (const link of footerLinks) {
        const text = (link.textContent || "").toLowerCase();
        const href = (link.getAttribute("href") || "").toLowerCase();
        for (const kw of essentialKeywords) {
          if (text.includes(kw) || href.includes(kw)) {
            foundKeywords.add(kw);
          }
        }
      }
    }

    for (const kw of essentialKeywords) {
      if (!foundKeywords.has(kw)) {
        findings.push(
          makeFinding(`missing-footer-${kw}`, "info", "Missing footer links",
            `No "${kw}" link was found in the footer area. Consider adding essential footer links for user trust and compliance.`)
        );
      }
    }
  } catch { /* swallow */ }
}

// ─── Checkout Checks ──────────────────────────────────────────────────

function checkShippingInfo(findings: Finding[]): void {
  try {
    const bodyText = (document.body?.textContent || "").toLowerCase();
    const hasShippingMention = /shipping|delivery/.test(bodyText);
    const hasPriceOrFree = /free|(\$\d+|\d+\.\d{2})/.test(bodyText);
    if (!(hasShippingMention && hasPriceOrFree)) {
      findings.push(
        makeFinding("no-shipping-info", "critical", "No shipping info visible",
          "No shipping or delivery cost information was found near the checkout. Unexpected costs at checkout are the top reason for cart abandonment.")
      );
    }
  } catch { /* swallow */ }
}

function checkOrderSummary(findings: Finding[]): void {
  try {
    const summaryEls = document.querySelectorAll(
      '[class*="summary" i], [class*="cart" i], [class*="order" i]'
    );
    let found = false;
    for (const el of summaryEls) {
      const text = el.textContent || "";
      // Look for price-like text
      if (/\$\d+|\d+\.\d{2}/.test(text)) {
        found = true;
        break;
      }
    }
    if (!found) {
      findings.push(
        makeFinding("no-order-summary", "warning", "No order summary",
          "No order or cart summary with pricing was found on this checkout page. Showing an order summary reduces user anxiety and cart abandonment.")
      );
    }
  } catch { /* swallow */ }
}

function checkTrustBadges(findings: Finding[]): void {
  try {
    const trustKeywords = /secure|ssl|trust|badge|norton|mcafee|verified/i;
    const images = document.querySelectorAll("img");
    let found = false;
    for (const img of images) {
      const alt = img.getAttribute("alt") || "";
      const cls = img.className || "";
      const src = img.getAttribute("src") || "";
      if (trustKeywords.test(alt) || trustKeywords.test(cls) || trustKeywords.test(src)) {
        found = true;
        break;
      }
    }
    if (!found) {
      // Also check non-image elements
      const trustEls = document.querySelectorAll(
        '[class*="secure" i], [class*="ssl" i], [class*="trust" i], [class*="badge" i], [class*="verified" i]'
      );
      if (trustEls.length > 0) found = true;
    }
    if (!found) {
      findings.push(
        makeFinding("no-trust-badges", "warning", "No trust badges",
          "No trust or security badges were found on this checkout page. Trust signals can significantly improve conversion rates.")
      );
    }
  } catch { /* swallow */ }
}

// ─── Blog / Article Checks ────────────────────────────────────────────

function checkContentWidth(findings: Finding[]): void {
  try {
    const contentSelectors = [
      "article",
      '[role="article"]',
      "main",
      '[class*="content" i]',
      '[class*="post" i]',
      '[class*="article" i]',
    ];
    for (const sel of contentSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 800) {
          findings.push(
            makeFinding("content-too-wide", "warning", "Content too wide",
              `The main content area is ${Math.round(rect.width)}px wide. For optimal readability, text columns should be 650-750px wide.`,
              getReliableSelector(el))
          );
          break;
        }
      }
    }
  } catch { /* swallow */ }
}

function checkRelatedArticles(findings: Finding[]): void {
  try {
    const relatedEls = document.querySelectorAll(
      '[class*="related" i], [class*="recommended" i], [class*="also-like" i], [class*="more-posts" i]'
    );
    if (relatedEls.length > 0) return;

    // Also check for headings containing "Related"
    const headings = document.querySelectorAll("h2, h3, h4");
    for (const h of headings) {
      if (/related|recommended|you (may |might )?also/i.test(h.textContent || "")) {
        return;
      }
    }

    findings.push(
      makeFinding("no-related-articles", "info", "No related articles",
        "No related or recommended articles section was found. Adding related content can increase engagement and time on site.")
    );
  } catch { /* swallow */ }
}

function checkPublicationDate(findings: Finding[]): void {
  try {
    // Check for <time> elements
    const timeEls = document.querySelectorAll("time");
    if (timeEls.length > 0) return;

    // Check for date patterns in text near article title
    const article = document.querySelector("article, main, [role='article']");
    if (article) {
      const text = article.textContent || "";
      // Match common date formats
      const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/i;
      if (datePattern.test(text)) return;
    }

    // Check for date-related classes
    const dateEls = document.querySelectorAll(
      '[class*="date" i], [class*="publish" i], [class*="posted" i], [class*="byline" i]'
    );
    if (dateEls.length > 0) return;

    findings.push(
      makeFinding("no-publication-date", "warning", "No publication date",
        "No publication date was found on this article. Displaying dates helps readers assess content freshness and builds trust.")
    );
  } catch { /* swallow */ }
}

// ─── Pricing Checks ──────────────────────────────────────────────────

function checkComparisonTable(findings: Finding[]): void {
  try {
    const tables = document.querySelectorAll("table");
    if (tables.length > 0) return;

    // Check for structured comparison grids
    const grids = document.querySelectorAll(
      '[class*="comparison" i], [class*="feature" i][class*="grid" i], [class*="plan" i][class*="grid" i]'
    );
    if (grids.length > 0) return;

    findings.push(
      makeFinding("no-comparison-table", "warning", "No comparison table",
        "No feature comparison table was found on this pricing page. Comparison tables help users choose the right plan.")
    );
  } catch { /* swallow */ }
}

function checkFAQSection(findings: Finding[]): void {
  try {
    const faqEls = document.querySelectorAll('[class*="faq" i]');
    if (faqEls.length > 0) return;

    const bodyText = document.body?.textContent || "";
    if (/FAQ|Frequently Asked|Frequently asked questions/i.test(bodyText)) return;

    findings.push(
      makeFinding("no-faq-section", "info", "No FAQ section",
        "No FAQ section was found on this pricing page. Answering common questions on the pricing page can reduce support load and increase conversions.")
    );
  } catch { /* swallow */ }
}

// ─── Signup / Login Checks ────────────────────────────────────────────

function checkTermsLink(findings: Finding[]): void {
  try {
    const forms = document.querySelectorAll("form");
    const links = document.querySelectorAll("a");
    let found = false;

    for (const link of links) {
      const text = (link.textContent || "").toLowerCase();
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (/terms|privacy|policy/.test(text) || /terms|privacy|policy/.test(href)) {
        found = true;
        break;
      }
    }

    if (!found && forms.length > 0) {
      findings.push(
        makeFinding("no-terms-link", "warning", "No terms link",
          "No link to terms of service or privacy policy was found near the signup form. This is important for legal compliance and user trust.")
      );
    }
  } catch { /* swallow */ }
}

function checkCrossLink(pageType: PageType, findings: Finding[]): void {
  try {
    const bodyText = (document.body?.textContent || "").toLowerCase();
    const links = document.querySelectorAll("a");
    const linkTexts: string[] = [];
    for (const link of links) {
      linkTexts.push((link.textContent || "").toLowerCase());
    }
    const allText = linkTexts.join(" ");

    if (pageType === PageType.Login) {
      const hasSignupLink = /sign\s*up|create\s*(an?\s*)?account|register|join/i.test(allText);
      if (!hasSignupLink) {
        findings.push(
          makeFinding("no-signup-link", "warning", "No signup link",
            "No link to create an account was found on this login page. Users who don't have an account should be able to easily find the signup page.")
        );
      }
    } else if (pageType === PageType.Signup) {
      const hasLoginLink = /log\s*in|sign\s*in|already\s*have\s*(an?\s*)?account/i.test(allText);
      if (!hasLoginLink) {
        findings.push(
          makeFinding("no-login-link", "warning", "No login link",
            "No link to log in was found on this signup page. Existing users should be able to easily navigate to the login page.")
        );
      }
    }
  } catch { /* swallow */ }
}

// ─── Main Entry Point ────────────────────────────────────────────────

/**
 * Runs page-type-specific best practice checks based on the detected page type.
 * Only checks relevant to the current page type are executed.
 */
export function runPageSpecificChecks(pageType: PageType): { findings: Finding[] } {
  const findings: Finding[] = [];

  // Landing / Homepage checks
  if (pageType === PageType.Landing || pageType === PageType.Homepage) {
    checkCTAAboveFold(findings);
    checkCompetingCTAs(findings);
    checkWallOfText(findings);
    checkFooterLinks(findings);
  }

  // Checkout checks
  if (pageType === PageType.Checkout) {
    checkShippingInfo(findings);
    checkOrderSummary(findings);
    checkTrustBadges(findings);
  }

  // Blog / Article checks
  if (pageType === PageType.Blog) {
    checkContentWidth(findings);
    checkRelatedArticles(findings);
    checkPublicationDate(findings);
  }

  // Pricing checks
  if (pageType === PageType.Pricing) {
    checkComparisonTable(findings);
    checkFAQSection(findings);
  }

  // Signup / Login checks
  if (pageType === PageType.Signup) {
    checkTermsLink(findings);
    checkCrossLink(pageType, findings);
  }
  if (pageType === PageType.Login) {
    checkCrossLink(pageType, findings);
  }

  return { findings };
}
