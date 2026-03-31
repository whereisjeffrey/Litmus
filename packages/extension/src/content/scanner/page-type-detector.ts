import { PageType } from "@placeholder/shared";

/**
 * Detects the type of page the user is currently viewing using a
 * multi-signal scoring approach. Signals include URL patterns, page
 * content analysis, and meta tag inspection.
 *
 * Designed to run early in the scan pipeline — uses direct DOM queries
 * rather than crawled data so it has no dependencies on other scanners.
 */
export function detectPageType(): PageType {
  const scores = initScores();

  scoreUrlPatterns(scores);
  scoreMetaTags(scores);
  scorePageContent(scores);

  return pickWinner(scores, 3);
}

// ─── Helpers ──────────────────────────────────────────────────────────

function initScores(): Record<PageType, number> {
  const scores = {} as Record<PageType, number>;
  for (const value of Object.values(PageType)) {
    scores[value as PageType] = 0;
  }
  return scores;
}

function pickWinner(scores: Record<PageType, number>, threshold: number): PageType {
  let best: PageType = PageType.Unknown;
  let bestScore = 0;

  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = type as PageType;
    }
  }

  return bestScore >= threshold ? best : PageType.Unknown;
}

// ─── Signal 1: URL Patterns (5 points) ───────────────────────────────

function scoreUrlPatterns(scores: Record<PageType, number>): void {
  const pathname = window.location.pathname.toLowerCase();
  const URL_WEIGHT = 5;

  // Homepage: root path
  if (pathname === "/" || pathname === "") {
    scores[PageType.Homepage] += URL_WEIGHT;
    return;
  }

  const urlRules: Array<[RegExp, PageType]> = [
    [/\/(pricing|plans|packages)(\/|$)/, PageType.Pricing],
    [/\/(checkout|cart|payment|order)(\/|$)/, PageType.Checkout],
    [/\/(signup|sign-up|register|join|create-account)(\/|$)/, PageType.Signup],
    [/\/(login|signin|sign-in|auth)(\/|$)/, PageType.Login],
    [/\/(dashboard|app|admin|console|portal)(\/|$)/, PageType.Dashboard],
    [/\/(blog|post|article|news)(\/|$)/, PageType.Blog],
    [/\/(docs|documentation|wiki|guide|faq)(\/|$)/, PageType.Documentation],
    [/\/(product|item|shop)(\/|$)/, PageType.Product],
    [/\/(contact|support|feedback)(\/|$)/, PageType.Contact],
    [/\/(settings|preferences|account|profile)(\/|$)/, PageType.Settings],
    [/\/(onboarding|welcome|getting-started|setup)(\/|$)/, PageType.Onboarding],
    [/\/(about|team|company|mission)(\/|$)/, PageType.About],
  ];

  // /help can be either Documentation or Contact — give points to both
  if (/\/help(\/|$)/.test(pathname)) {
    scores[PageType.Documentation] += URL_WEIGHT;
    scores[PageType.Contact] += URL_WEIGHT;
  }

  for (const [pattern, type] of urlRules) {
    if (pattern.test(pathname)) {
      scores[type] += URL_WEIGHT;
    }
  }
}

// ─── Signal 2: Meta Tags (2 points) ──────────────────────────────────

function scoreMetaTags(scores: Record<PageType, number>): void {
  const META_WEIGHT = 2;

  // og:type
  const ogType = getMetaContent("og:type");
  if (ogType) {
    const ogLower = ogType.toLowerCase();
    if (ogLower === "article") scores[PageType.Blog] += META_WEIGHT;
    if (ogLower === "product") scores[PageType.Product] += META_WEIGHT;
  }

  // Title-based signals
  const title = (document.title || "").toLowerCase();

  const titleRules: Array<[RegExp, PageType]> = [
    [/pricing|plans/, PageType.Pricing],
    [/login|sign\s?in/, PageType.Login],
    [/sign\s?up|register|join|create account/, PageType.Signup],
    [/dashboard/, PageType.Dashboard],
    [/documentation|docs|api\s+reference/, PageType.Documentation],
    [/checkout|payment|cart/, PageType.Checkout],
    [/contact|support/, PageType.Contact],
    [/settings|preferences/, PageType.Settings],
    [/onboarding|welcome|getting started/, PageType.Onboarding],
    [/about|our team|our company/, PageType.About],
  ];

  for (const [pattern, type] of titleRules) {
    if (pattern.test(title)) {
      scores[type] += META_WEIGHT;
    }
  }
}

// ─── Signal 3: Page Content Analysis (3 points) ──────────────────────

function scorePageContent(scores: Record<PageType, number>): void {
  const CONTENT_WEIGHT = 3;

  // Pricing signals: pricing tables, multiple price-like elements
  const priceElements = document.querySelectorAll(
    '[class*="price" i], [class*="pricing" i], [class*="plan" i]'
  );
  const bodyText = document.body?.textContent || "";
  const pricePatterns = bodyText.match(/\$\d+|\d+\s*\/\s*mo|\d+\s*\/\s*year|per\s+month/gi);
  if (priceElements.length >= 2 || (pricePatterns && pricePatterns.length >= 3)) {
    scores[PageType.Pricing] += CONTENT_WEIGHT;
  }

  // Checkout / payment signals
  const paymentInputs = document.querySelectorAll(
    'input[name*="card" i], input[name*="cc-" i], input[autocomplete*="cc-"], [class*="payment" i], [class*="checkout" i], [data-stripe], [class*="stripe" i]'
  );
  if (paymentInputs.length > 0) {
    scores[PageType.Checkout] += CONTENT_WEIGHT;
  }

  // Form field counting for login/signup detection
  const visibleInputs = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"])'
  );
  const passwordFields = document.querySelectorAll('input[type="password"]');
  const emailFields = document.querySelectorAll(
    'input[type="email"], input[name*="email" i], input[autocomplete="email"], input[autocomplete="username"]'
  );

  if (passwordFields.length > 0 && emailFields.length > 0) {
    if (visibleInputs.length <= 3) {
      // Login: few fields (email/username + password, maybe remember-me)
      scores[PageType.Login] += CONTENT_WEIGHT;
    } else if (visibleInputs.length <= 6) {
      // Signup: more fields (name, email, password, confirm, etc.)
      scores[PageType.Signup] += CONTENT_WEIGHT;
    }
  }

  // Dashboard signals: sidebar nav + main content + app-like layout
  const hasSidebarNav = !!document.querySelector(
    'nav[class*="sidebar" i], aside[class*="nav" i], [class*="sidebar" i][role="navigation"], [class*="side-nav" i], [class*="sidenav" i]'
  );
  const hasMainContent = !!document.querySelector('main, [role="main"]');
  const hasAppLayout = !!document.querySelector(
    '[class*="dashboard" i], [class*="app-layout" i], [class*="admin" i]'
  );
  if ((hasSidebarNav && hasMainContent) || hasAppLayout) {
    scores[PageType.Dashboard] += CONTENT_WEIGHT;
  }

  // Blog / article signals
  const hasArticleTag = !!document.querySelector("article, [role='article']");
  const hasPublishDate = !!document.querySelector(
    'time[datetime], [class*="publish" i], [class*="posted" i], [class*="date" i][class*="article" i], [class*="byline" i]'
  );
  const hasAuthor = !!document.querySelector(
    '[class*="author" i], [rel="author"], [itemprop="author"]'
  );
  const paragraphs = document.querySelectorAll("p").length;
  const longTextContent = (document.body?.textContent?.length || 0) > 3000;

  if (hasArticleTag || (hasPublishDate && hasAuthor)) {
    scores[PageType.Blog] += CONTENT_WEIGHT;
  } else if (longTextContent && paragraphs > 5) {
    // Weaker blog signal — long content with many paragraphs
    scores[PageType.Blog] += 1;
  }

  // Product page signals
  const hasAddToCart = !!document.querySelector(
    '[class*="add-to-cart" i], [class*="addtocart" i], button[name*="cart" i], [data-action*="cart" i]'
  );
  const hasProductImage = !!document.querySelector(
    '[class*="product-image" i], [class*="product-gallery" i], [itemprop="image"]'
  );
  const hasPriceDisplay = !!document.querySelector(
    '[itemprop="price"], [class*="product-price" i], [data-price]'
  );
  if (hasAddToCart || (hasProductImage && hasPriceDisplay)) {
    scores[PageType.Product] += CONTENT_WEIGHT;
  }

  // Contact / support signals
  const hasContactForm = !!document.querySelector(
    'form[class*="contact" i], form[id*="contact" i], form[action*="contact" i]'
  );
  const hasContactInfo = !!document.querySelector(
    '[class*="contact" i][class*="info" i], [href^="mailto:"], [href^="tel:"]'
  );
  if (hasContactForm || hasContactInfo) {
    scores[PageType.Contact] += CONTENT_WEIGHT;
  }

  // Documentation signals
  const codeBlocks = document.querySelectorAll("pre code, pre[class*='language'], code[class*='language']").length;
  const hasTableOfContents = !!document.querySelector(
    '[class*="toc" i], [class*="table-of-contents" i], [id*="toc" i]'
  );
  const hasApiReference = !!document.querySelector(
    '[class*="api" i][class*="ref" i], [class*="endpoint" i], [class*="method-" i]'
  );
  if (codeBlocks > 2 || (hasTableOfContents && hasSidebarNav) || hasApiReference) {
    scores[PageType.Documentation] += CONTENT_WEIGHT;
  }

  // Settings signals
  const hasSettingsForm = !!document.querySelector(
    'form[class*="settings" i], form[id*="settings" i], [class*="preferences" i]'
  );
  const hasToggleSwitches = document.querySelectorAll(
    'input[type="checkbox"][role="switch"], [class*="toggle" i][class*="switch" i], [role="switch"]'
  ).length;
  if (hasSettingsForm || hasToggleSwitches >= 3) {
    scores[PageType.Settings] += CONTENT_WEIGHT;
  }

  // Onboarding signals
  const hasProgressSteps = !!document.querySelector(
    '[class*="stepper" i], [class*="progress-step" i], [class*="onboarding" i], [class*="wizard" i], [role="progressbar"]'
  );
  if (hasProgressSteps) {
    scores[PageType.Onboarding] += CONTENT_WEIGHT;
  }

  // Landing page signals: hero section, CTAs, testimonials
  const hasHero = !!document.querySelector(
    '[class*="hero" i], [class*="landing" i], [class*="banner" i][class*="main" i]'
  );
  const hasCTA = !!document.querySelector(
    '[class*="cta" i], [class*="call-to-action" i]'
  );
  const hasTestimonials = !!document.querySelector(
    '[class*="testimonial" i], [class*="review" i][class*="section" i]'
  );
  if (hasHero || (hasCTA && hasTestimonials)) {
    scores[PageType.Landing] += CONTENT_WEIGHT;
  }

  // About page signals
  const hasTeamSection = !!document.querySelector(
    '[class*="team" i][class*="section" i], [class*="team-member" i], [class*="our-team" i]'
  );
  const hasMission = !!document.querySelector(
    '[class*="mission" i], [class*="values" i], [class*="about-us" i]'
  );
  if (hasTeamSection || hasMission) {
    scores[PageType.About] += CONTENT_WEIGHT;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────

function getMetaContent(nameOrProperty: string): string | null {
  const el =
    document.querySelector(`meta[name="${nameOrProperty}"]`) ||
    document.querySelector(`meta[property="${nameOrProperty}"]`);
  return el?.getAttribute("content") || null;
}
