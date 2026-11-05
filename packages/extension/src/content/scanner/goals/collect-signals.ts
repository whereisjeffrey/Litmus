/**
 * Goal Signal Collectors — deterministic, DOM-based metrics that ground the
 * AI's goal analysis, plus "anchors" (real elements with selectors) the AI
 * can reference so friction points get accurate "Show Me" highlighting.
 *
 * Each goal pulls only the signals relevant to it (see packages/shared goals.ts).
 * These run in the content script, against the live page.
 */

import type { GoalId, GoalAnchor, NavCandidate, JourneyStep, PageType } from "@placeholder/shared";
import { getReliableSelector } from "../selector-utils";
import { detectPageType } from "../page-type-detector";

type SignalValue = string | number | boolean;

export interface CollectedSignals {
  signals: Record<string, SignalValue>;
  anchors: GoalAnchor[];
  navCandidates: NavCandidate[];
  entry: JourneyStep;
}

// ─── DOM helpers ────────────────────────────────────────────────────

const ACTION_WORDS = [
  "buy", "add to cart", "add to bag", "checkout", "check out", "pay", "purchase",
  "order", "sign up", "signup", "get started", "start free", "start now", "try",
  "subscribe", "join", "book", "schedule", "request", "demo", "continue",
  "register", "create account", "claim", "download", "contact sales",
];

const TRUST_WORDS = [
  "secure", "ssl", "encrypted", "guarantee", "money-back", "money back",
  "refund", "free returns", "verified", "trusted", "norton", "mcafee",
  "pci", "gdpr", "hipaa", "30-day", "no risk",
];

const PROOF_WORDS = [
  "testimonial", "review", "rated", "customers", "users", "trusted by",
  "as seen", "star", "★", "loved by", "join thousands", "5-star",
];

// Elements that LOOK like CTAs but are never the primary conversion — app-store
// badges, social links, auth links. These were polluting CTA detection (e.g. a
// footer "Download the app" button getting picked as the main CTA).
const EXCLUDE_CTA_TEXT = /\b(download( the)? app|get( it)? on (the )?app store|google play|app store|sign ?in|log ?in|sign ?out|facebook|twitter|instagram|youtube|linked\s?in|tiktok|pinterest)\b/i;
const EXCLUDE_CTA_HREF = /(apps\.apple\.com|itunes\.apple\.com|play\.google\.com|facebook\.com|twitter\.com|x\.com|instagram\.com|youtube\.com|linkedin\.com|tiktok\.com|pinterest\.com)/i;
const EXCLUDE_CTA_CLASS = /(app-?download|app-?store|store-?badge|social|footer)/i;

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
}

function vQuery(selector: string): Element[] {
  return Array.from(document.querySelectorAll(selector)).filter(isVisible);
}

function elText(el: Element): string {
  return (el.textContent || "").trim().toLowerCase();
}

function bodyText(): string {
  return (document.body.innerText || "").toLowerCase();
}

function isAboveFold(el: Element): boolean {
  return el.getBoundingClientRect().top < window.innerHeight;
}

function area(el: Element): number {
  const r = el.getBoundingClientRect();
  return r.width * r.height;
}

function anchor(key: string, label: string, el: Element | null | undefined): GoalAnchor | null {
  if (!el) return null;
  try {
    return { key, label, selector: getReliableSelector(el) };
  } catch {
    return null;
  }
}

/** True for app-store / social / auth links that are never the primary conversion. */
function isExcludedCta(el: Element, text: string): boolean {
  if (EXCLUDE_CTA_TEXT.test(text)) return true;
  const href = (el.getAttribute("href") || "").toLowerCase();
  if (href && EXCLUDE_CTA_HREF.test(href)) return true;
  const cls = typeof (el as HTMLElement).className === "string" ? (el as HTMLElement).className : "";
  if (cls && EXCLUDE_CTA_CLASS.test(cls)) return true;
  // app-store image badges
  if (el.querySelector("img[alt*='App Store' i], img[alt*='Google Play' i]")) return true;
  return false;
}

/** Honest, evidence-based label for a CTA element (its visible text), so the AI
 *  is never told an element is "the primary CTA" when we're only guessing. */
function ctaLabel(el: Element): string {
  const t = (elText(el) || (el as HTMLInputElement).value || el.getAttribute("aria-label") || "").trim();
  return t ? `Button/link reading "${t.slice(0, 40)}"` : "A call-to-action element";
}

/** All action-CTA elements on the page (links/buttons whose text implies converting). */
function findCtas(): Element[] {
  const candidates = vQuery("a, button, [role='button'], input[type='submit']");
  return candidates.filter((el) => {
    const t = elText(el) || (el.getAttribute("value") || "").toLowerCase() || (el.getAttribute("aria-label") || "").toLowerCase();
    if (!t || t.length >= 40) return false;
    if (!ACTION_WORDS.some((w) => t.includes(w))) return false;
    return !isExcludedCta(el, t);
  });
}

/** The site's search entry, when the conversion is search-driven (the search box
 *  is the real primary CTA on sites like marketplaces, travel, real estate). */
function findSearchEntry(): Element | null {
  const input = vQuery(
    "input[type='search'], [role='searchbox'], [role='search'] input, form[role='search'] input, input[name*='search' i], input[aria-label*='search' i], input[placeholder*='search' i]"
  )[0];
  if (input) return input;
  const form = document.querySelector("form[role='search'], [role='search']");
  return form && isVisible(form) ? form : null;
}

/** The most prominent ABOVE-THE-FOLD action CTA. Returns undefined when there's
 *  no confident candidate — better to send no anchor than a wrong one (a stray
 *  footer button). The AI identifies the true primary CTA from the screenshot. */
function primaryCta(ctas: Element[]): Element | undefined {
  const aboveFold = ctas.filter(isAboveFold);
  return aboveFold.sort((a, b) => area(b) - area(a))[0];
}

function navItems(): Element[] {
  const nav = document.querySelector("nav, header, [role='navigation']");
  if (!nav) return [];
  return Array.from(nav.querySelectorAll("a")).filter(isVisible);
}

function mainContentRoot(): Element {
  return (
    document.querySelector("main, article, [role='main']") || document.body
  );
}

/**
 * Collect clickable candidates the journey engine can choose from to advance
 * the flow — visible links and buttons with meaningful text, deduped, prominent
 * ones first. Capped to keep the prompt focused.
 */
function collectNavCandidates(limit = 30): NavCandidate[] {
  const els = vQuery("a[href], button, [role='button'], input[type='submit']");
  const seen = new Set<string>();
  const out: { c: NavCandidate; score: number }[] = [];

  for (const el of els) {
    const text = (elText(el) || (el.getAttribute("value") || "").trim() || el.getAttribute("aria-label") || "").trim();
    if (!text || text.length > 60) continue;
    // Skip nav noise we never want to click during a goal journey.
    if (/^(skip to|back to top)$/i.test(text)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const af = isAboveFold(el);
    const isAction = ACTION_WORDS.some((w) => key.includes(w));
    const score = (isAction ? 100 : 0) + (af ? 20 : 0) + Math.min(area(el) / 1000, 30);

    out.push({
      c: {
        key: `nav-${out.length}`,
        text,
        selector: (() => { try { return getReliableSelector(el); } catch { return ""; } })(),
        kind: el.tagName.toLowerCase() === "a" ? "link" : "button",
        aboveFold: af,
      },
      score,
    });
  }

  return out
    .filter((o) => o.c.selector)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((o) => o.c);
}

// ─── Per-goal collectors ────────────────────────────────────────────

function collectReachConversionFast(): { signals: Record<string, SignalValue>; anchors: GoalAnchor[] } {
  const ctas = findCtas();
  const search = findSearchEntry();
  const searchAboveFold = !!search && isAboveFold(search);
  // On search-driven sites the search box IS the primary conversion entry; only
  // fall back to a button CTA when there's no prominent search. Never assert a
  // primary CTA we aren't confident about — the AI confirms it from the screenshot.
  const primary: Element | undefined = searchAboveFold ? search! : primaryCta(ctas);
  const primaryIsSearch = searchAboveFold;
  const nav = navItems();
  const interstitials = vQuery(
    "[class*='modal'], [class*='popup'], [class*='cookie'], [class*='consent'], [class*='overlay'], dialog[open]"
  );

  const anchors = [
    primary
      ? anchor("primaryCta", primaryIsSearch ? "A search box (candidate primary entry)" : `${ctaLabel(primary)} (candidate primary CTA — verify against the screenshot)`, primary)
      : null,
    anchor("primaryNav", "Main navigation", document.querySelector("nav, header")),
    anchor("firstInterstitial", "Interstitial / pop-up", interstitials[0]),
  ].filter(Boolean) as GoalAnchor[];

  return {
    signals: {
      clicksToTarget: primary ? 1 : "unknown",
      ctaCandidatesAboveFold: ctas.filter(isAboveFold).length,
      hasSearchEntry: !!search,
      primaryLooksLikeSearch: primaryIsSearch,
      navItemCount: nav.length,
      ctaAboveFold: !!primary,
      interstitialCount: interstitials.length,
    },
    anchors,
  };
}

function collectCompleteTheForm(): { signals: Record<string, SignalValue>; anchors: GoalAnchor[] } {
  const forms = vQuery("form");
  const mainForm = forms.sort(
    (a, b) => b.querySelectorAll("input,select,textarea").length - a.querySelectorAll("input,select,textarea").length
  )[0];
  const fields = mainForm
    ? Array.from(mainForm.querySelectorAll("input, select, textarea")).filter(
        (f) => (f as HTMLInputElement).type !== "hidden"
      )
    : [];
  const required = fields.filter((f) => (f as HTMLInputElement).required);
  const text = bodyText();

  const anchors = [
    anchor("mainForm", "The form / checkout", mainForm),
    anchor("submit", "Submit button", mainForm?.querySelector("[type='submit'], button")),
  ].filter(Boolean) as GoalAnchor[];

  return {
    signals: {
      fieldCount: fields.length,
      requiredFieldCount: required.length,
      hasInlineValidation: !!document.querySelector("[aria-invalid], [class*='error'], [class*='valid']"),
      hasGuestOption: /guest/.test(text),
      stepsCount: vQuery("[class*='step'], [class*='progress'], ol li").length > 0 ? 1 : 1,
      costsShownEarly: /(shipping|tax|total|subtotal)/.test(text),
    },
    anchors,
  };
}

function collectCaptureTheLead(): { signals: Record<string, SignalValue>; anchors: GoalAnchor[] } {
  const ctas = findCtas();
  const primary = primaryCta(ctas);
  const h1 = document.querySelector("h1");
  const leadForm = vQuery("form").find((f) =>
    Array.from(f.querySelectorAll("input")).some((i) => (i as HTMLInputElement).type === "email")
  );
  const leadFields = leadForm
    ? Array.from(leadForm.querySelectorAll("input")).filter((i) => (i as HTMLInputElement).type !== "hidden")
    : [];
  const text = bodyText();

  const anchors = [
    anchor("headline", "Headline / value prop", h1),
    anchor("leadForm", "Lead capture form", leadForm),
    primary ? anchor("primaryCta", `${ctaLabel(primary)} (candidate CTA — verify against the screenshot)`, primary) : null,
  ].filter(Boolean) as GoalAnchor[];

  return {
    signals: {
      valuePropClarity: !!h1 && isAboveFold(h1) && (h1.textContent || "").trim().length > 10,
      leadCtaCount: ctas.length,
      leadFormFields: leadFields.length,
      hasSocialProof: PROOF_WORDS.some((w) => text.includes(w)),
      exchangeSpecificity: /(report|guide|ebook|template|demo|trial|free|checklist|webinar)/.test(text),
    },
    anchors,
  };
}

function collectReadToTheEnd(): { signals: Record<string, SignalValue>; anchors: GoalAnchor[] } {
  const root = mainContentRoot();
  const paragraphs = Array.from(root.querySelectorAll("p")).filter(isVisible);
  const words = (root.textContent || "").trim().split(/\s+/).length;
  const subheads = Array.from(root.querySelectorAll("h2, h3")).filter(isVisible);
  const avgParaWords = paragraphs.length
    ? Math.round(paragraphs.reduce((s, p) => s + (p.textContent || "").trim().split(/\s+/).length, 0) / paragraphs.length)
    : 0;
  const firstPara = paragraphs[0];
  const lineChars = firstPara
    ? Math.round((firstPara.getBoundingClientRect().width || 0) / (parseFloat(getComputedStyle(firstPara).fontSize) * 0.5 || 8))
    : 0;
  const lastCta = findCtas().slice(-1)[0];
  const distractions = vQuery("[class*='ad'], [class*='popup'], [class*='newsletter'], iframe");

  const anchors = [
    anchor("firstParagraph", "Opening paragraph", firstPara),
    anchor("endCta", "End-of-content CTA", lastCta),
    anchor("firstDistraction", "Mid-content distraction", distractions[0]),
  ].filter(Boolean) as GoalAnchor[];

  return {
    signals: {
      wordCount: words,
      avgParagraphLength: avgParaWords,
      subheadCount: subheads.length,
      lineLength: lineChars,
      hasEndCta: !!lastCta,
      distractionDensity: distractions.length,
    },
    anchors,
  };
}

function collectBuildTrustFast(): { signals: Record<string, SignalValue>; anchors: GoalAnchor[] } {
  const text = bodyText();
  const ctas = findCtas();
  const primary = primaryCta(ctas);
  const proofEl = Array.from(document.querySelectorAll("[class*='testimonial'], [class*='review'], [class*='logo'], [class*='rating']")).filter(isVisible)[0];
  const badgeEl = Array.from(document.querySelectorAll("[class*='badge'], [class*='secure'], [class*='trust'], [class*='guarantee']")).filter(isVisible)[0];

  const proofPresent = PROOF_WORDS.some((w) => text.includes(w)) || !!proofEl;
  const trustBefore =
    !!proofEl && !!primary
      ? proofEl.getBoundingClientRect().top < primary.getBoundingClientRect().top
      : proofPresent;

  const anchors = [
    anchor("socialProof", "Social proof", proofEl),
    anchor("trustBadge", "Trust / security badge", badgeEl),
    primary ? anchor("primaryCta", `${ctaLabel(primary)} (candidate CTA — verify against the screenshot)`, primary) : null,
  ].filter(Boolean) as GoalAnchor[];

  return {
    signals: {
      socialProofPresent: proofPresent,
      trustBadgePresent: !!badgeEl || TRUST_WORDS.some((w) => text.includes(w)),
      namedAuthority: !!document.querySelector("[class*='author'], [class*='founder'], [rel='author']"),
      riskReversalPresent: /(guarantee|money-back|money back|free returns|refund|cancel anytime|no risk)/.test(text),
      visualPolish: true, // refined by the standard scan score passed alongside
      trustBeforeAsk: trustBefore,
    },
    anchors,
  };
}

// ─── Entry point ────────────────────────────────────────────────────

export function collectGoalSignals(goalId: GoalId): CollectedSignals {
  let collected: { signals: Record<string, SignalValue>; anchors: GoalAnchor[] };

  switch (goalId) {
    case "reach-conversion-fast":
      collected = collectReachConversionFast();
      break;
    case "complete-the-form":
      collected = collectCompleteTheForm();
      break;
    case "capture-the-lead":
      collected = collectCaptureTheLead();
      break;
    case "read-to-the-end":
      collected = collectReadToTheEnd();
      break;
    case "build-trust-fast":
      collected = collectBuildTrustFast();
      break;
    case "custom":
    default: {
      // For custom goals, collect a broad union of useful signals + anchors.
      const a = collectReachConversionFast();
      const b = collectBuildTrustFast();
      collected = {
        signals: { ...a.signals, ...b.signals },
        anchors: [...a.anchors, ...b.anchors],
      };
      break;
    }
  }

  const entry: JourneyStep = {
    index: 0,
    url: window.location.href,
    pageType: detectPageType() as PageType,
    actionTaken: null,
    frictionPointIds: [],
  };

  return {
    signals: collected.signals,
    anchors: collected.anchors,
    navCandidates: collectNavCandidates(),
    entry,
  };
}
