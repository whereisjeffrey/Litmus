/**
 * Prompt Framework — Transforms Claude from a technical auditor into a business consultant.
 *
 * Builds a context-aware prompt based on:
 * 1. Detected page type (landing, checkout, pricing, etc.)
 * 2. Detected or specified industry (SaaS, e-commerce, fintech, etc.)
 * 3. Actual scan data (findings, scores, metrics)
 *
 * The prompt instructs Claude to produce CEO-level insights focused on
 * revenue impact, customer loss, and competitive disadvantage — not
 * technical HTML attributes.
 */

import type { ScanResult, PageType } from "@placeholder/shared";

// ─── Industry Detection ─────────────────────────────────────────────

const INDUSTRY_SIGNALS: Record<string, { keywords: string[]; urlPatterns: string[] }> = {
  saas: {
    keywords: [
      "free trial", "pricing", "enterprise", "integrations", "api",
      "dashboard", "workflow", "automation", "analytics", "saas",
      "subscribe", "plan", "tier", "per month", "per user",
      "onboarding", "product tour", "demo", "features",
    ],
    urlPatterns: ["app.", "dashboard.", "admin."],
  },
  ecommerce: {
    keywords: [
      "add to cart", "buy now", "checkout", "shipping", "free shipping",
      "product", "shop", "store", "price", "sale", "discount",
      "size", "color", "quantity", "review", "ratings", "wishlist",
      "returns", "refund",
    ],
    urlPatterns: ["shop.", "store.", "products/", "collections/"],
  },
  fintech: {
    keywords: [
      "banking", "investment", "portfolio", "loan", "mortgage",
      "interest rate", "apr", "credit score", "account", "transfer",
      "payment", "fintech", "insurance", "crypto", "trading",
      "fdic", "sec", "regulated",
    ],
    urlPatterns: ["bank.", "finance.", "invest.", "pay."],
  },
  medical: {
    keywords: [
      "patient", "doctor", "appointment", "health", "medical",
      "clinic", "hospital", "pharmacy", "prescription", "diagnosis",
      "hipaa", "provider", "insurance", "telehealth", "symptoms",
    ],
    urlPatterns: ["health.", "medical.", "patient.", "care."],
  },
  "professional-services": {
    keywords: [
      "attorney", "lawyer", "law firm", "accounting", "cpa",
      "consulting", "advisory", "practice areas", "case study",
      "consultation", "expertise", "industries we serve",
      "our team", "partners", "associates",
    ],
    urlPatterns: ["law.", "legal.", "consult."],
  },
  "real-estate": {
    keywords: [
      "listing", "property", "real estate", "home", "house",
      "apartment", "rent", "buy", "sell", "mortgage", "mls",
      "bedrooms", "bathrooms", "sq ft", "open house", "agent",
      "broker", "neighborhood", "virtual tour",
    ],
    urlPatterns: ["realty.", "homes.", "property.", "zillow", "realtor"],
  },
};

export function detectIndustry(scanResult: ScanResult): string {
  const url = scanResult.url.toLowerCase();
  const pageText = scanResult.crawl?.title?.toLowerCase() || "";
  const allText = `${url} ${pageText}`;

  const scores: Record<string, number> = {};

  for (const [industry, signals] of Object.entries(INDUSTRY_SIGNALS)) {
    let score = 0;

    for (const keyword of signals.keywords) {
      if (allText.includes(keyword)) score += 1;
    }

    for (const pattern of signals.urlPatterns) {
      if (url.includes(pattern)) score += 3;
    }

    scores[industry] = score;
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

  // Need at least 3 keyword matches to be confident
  if (sorted[0][1] >= 3) {
    return sorted[0][0];
  }

  return "general";
}

// ─── Scan Data Summary ──────────────────────────────────────────────

function buildScanSummary(scan: ScanResult): string {
  const lines: string[] = [];

  lines.push(`URL: ${scan.url}`);
  lines.push(`Page Type: ${scan.pageType}`);
  lines.push(`Overall Score: ${scan.overallScore}/100`);
  lines.push("");

  lines.push("Category Scores:");
  for (const cat of scan.categories) {
    lines.push(`  ${cat.name}: ${cat.score}/100 (${cat.findingsCount} findings)`);
  }
  lines.push("");

  // Key metrics from scan data
  if (scan.forms?.forms?.length) {
    const totalFields = scan.forms.forms.reduce(
      (sum: number, f: { fields?: unknown[] }) => sum + (f.fields?.length || 0),
      0
    );
    lines.push(`Forms: ${scan.forms.forms.length} forms, ${totalFields} total fields`);
  }

  if (scan.images) {
    const missingAlt = scan.images.findings?.filter(
      (f: { title?: string }) => f.title?.toLowerCase().includes("alt")
    ).length || 0;
    lines.push(`Images: ${missingAlt} missing alt text`);
  }

  if (scan.contrast) {
    const issues = scan.contrast.findings?.length || 0;
    lines.push(`Contrast: ${issues} issues found`);
  }

  if (scan.links) {
    const broken = scan.links.findings?.filter(
      (f: { severity?: string }) => f.severity === "critical"
    ).length || 0;
    lines.push(`Links: ${broken} broken/critical link issues`);
  }

  if (scan.headings) {
    const issues = scan.headings.findings?.length || 0;
    lines.push(`Headings: ${issues} hierarchy issues`);
  }

  if (scan.meta) {
    const missing = scan.meta.findings?.length || 0;
    lines.push(`Meta/SEO: ${missing} issues`);
  }

  lines.push("");
  lines.push(`Total findings: ${scan.allFindings.length}`);

  // Severity breakdown
  const critical = scan.allFindings.filter((f) => f.severity === "critical").length;
  const warning = scan.allFindings.filter((f) => f.severity === "warning").length;
  const info = scan.allFindings.filter((f) => f.severity === "info").length;
  lines.push(`  Critical: ${critical}, Warning: ${warning}, Info: ${info}`);

  return lines.join("\n");
}

// ─── Main Prompt Builder ────────────────────────────────────────────

export function buildConsultantPrompt(
  scanResult: ScanResult,
  industry?: string
): string {
  const detectedIndustry = industry || detectIndustry(scanResult);
  const scanSummary = buildScanSummary(scanResult);

  const industryContext = getIndustryContext(detectedIndustry);
  const pageTypeContext = getPageTypeContext(scanResult.pageType);

  return `You are a senior UX consultant who specializes in ${industryContext.label} businesses. A client has hired you to evaluate their ${scanResult.pageType} and identify the issues most likely costing them money and customers.

You are NOT a technical auditor. You are a business consultant. Your job is to tell the CEO what's wrong in language they care about: revenue, customers, competitive advantage, growth.

## The Client's Page

${scanSummary}

## Your Industry Expertise

${industryContext.expertise}

## Page-Specific Evaluation Criteria

${pageTypeContext}

## Your Task

Based on the scan data above and your expertise, identify the 3-5 most impactful issues on this page. These must be things that are LIKELY costing this business money or customers.

## Rules

1. NEVER use technical jargon in headlines. No "WCAG", "alt text", "meta tag", "heading hierarchy", "contrast ratio" in headlines. Those are engineer terms.
2. Every headline must make a CEO lean forward. It must imply money lost or customers lost.
3. Every impact statement must include a SPECIFIC research citation or statistic. "Studies show" is weak. "Baymard Institute found that 24% of users abandon when forced to create an account" is strong.
4. Do NOT include trivial issues. Missing alt text on a decorative image is not CEO-level. A broken signup flow IS.
5. Rank by estimated business impact. The thing most likely costing them the most money goes first.
6. Be specific to THIS page. Don't give generic advice. Reference actual findings from the scan data.
7. If the page is actually good, say so. Don't manufacture problems. A score of 85+ with minor issues should be framed positively.

## Output Format

Respond with ONLY valid JSON, no markdown, no explanation:

{
  "topInsights": [
    {
      "headline": "Plain English headline that makes a CEO care",
      "impact": "1-2 sentences explaining the business impact with a specific research citation.",
      "category": "signup|checkout|navigation|trust|content|mobile|performance|accessibility|pricing|onboarding",
      "severity": "high|medium|low",
      "locked": false,
      "fixes": ["Specific fix 1", "Specific fix 2", "Specific fix 3"],
      "research": "Full research citation with source name and year"
    }
  ],
  "executiveSummary": "One sentence: the single biggest risk on this page",
  "industryBenchmark": "One sentence: how this page compares to industry standards",
  "detectedIndustry": "${detectedIndustry}"
}

IMPORTANT:
- Return 3-5 topInsights, no more
- First 2 items: locked = false (visible to free users)
- Remaining items: locked = true (Pro only)
- Fixes array: 2-4 specific, actionable fixes per insight
- Research: real citations only (Baymard Institute, Nielsen Norman Group, HubSpot, Forrester, McKinsey, Stanford Web Credibility Project, Google, etc.)`;
}

// ─── Industry Context ───────────────────────────────────────────────

interface IndustryInfo {
  label: string;
  expertise: string;
}

function getIndustryContext(industry: string): IndustryInfo {
  const contexts: Record<string, IndustryInfo> = {
    saas: {
      label: "SaaS / Software",
      expertise: `You specialize in SaaS products. You know that:
- The average SaaS free trial conversion rate is 15-25% (Totango)
- Reducing signup friction by one field increases conversion ~10% (Imagescape)
- 55% of visitors spend less than 15 seconds on a page (Microsoft)
- SaaS companies with clear pricing pages convert 2x better than "Contact Sales" (OpenView)
- The best SaaS landing pages have one CTA, not three (Unbounce)
- Onboarding completion rates average 40-60% — the top quartile hits 80% (Userpilot)
- 96% of first-time visitors aren't ready to buy (Marketo)`,
    },
    ecommerce: {
      label: "E-Commerce",
      expertise: `You specialize in e-commerce. You know that:
- Average cart abandonment rate is 70.19% (Baymard Institute, 2023)
- 24% abandon because they were forced to create an account (Baymard)
- 48% abandon due to extra costs shown too late (shipping, tax, fees)
- Mobile commerce is 73% of all e-commerce but converts at half the desktop rate
- Product pages with 5+ images see 40% higher conversion (Shopify)
- Guest checkout increases conversion by 45% over forced registration (Baymard)
- Return policy visibility reduces cart abandonment by 17% (UPS/comScore)`,
    },
    fintech: {
      label: "Fintech / Financial Services",
      expertise: `You specialize in fintech. You know that:
- 81% of consumers say trust is a deciding factor in financial services (Edelman)
- Security badges increase conversion by up to 42% in financial contexts (Blue Fountain Media)
- KYC abandonment rates average 40-50% for complex flows (Signicat)
- Financial calculators increase time-on-site by 3x and conversion by 25% (HubSpot)
- 73% of consumers prefer digital banking but 41% switch banks due to poor UX (J.D. Power)`,
    },
    medical: {
      label: "Medical / Healthcare",
      expertise: `You specialize in healthcare. You know that:
- 77% of patients use search before booking an appointment (Google Health)
- Online scheduling increases booking rates by 24% (Accenture)
- 88% of patients consider online reviews when choosing a provider (Software Advice)
- HIPAA compliance is not optional — violations cost $100-$50,000 per incident
- Healthcare sites must meet WCAG AA — patient populations include elderly and disabled users
- 60% of patients will switch providers for a better digital experience (NRC Health)`,
    },
    "professional-services": {
      label: "Professional Services",
      expertise: `You specialize in professional services (law, accounting, consulting). You know that:
- 75% of people judge a firm's credibility based on their website design (Stanford Web Credibility Project)
- Professional service firms with case studies generate 70% more leads (Content Marketing Institute)
- Online booking for consultations increases intake conversion by 30% (Clio Legal Trends)
- Detailed service descriptions with pricing transparency increase inquiry rates by 25%
- Client testimonials with specific outcomes increase trust by 58% (BrightLocal)`,
    },
    "real-estate": {
      label: "Real Estate",
      expertise: `You specialize in real estate. You know that:
- 97% of homebuyers use the internet in their search (NAR, 2023)
- Listings with virtual tours get 87% more views (Realtor.com)
- 76% of buyers found their home on a mobile device (NAR)
- The average user spends 3 minutes on a property listing — they must find key info fast
- Agent profiles with video introductions generate 403% more inquiries (BombBomb)
- Properties with 20+ photos sell 32% faster (Redfin)`,
    },
    general: {
      label: "business",
      expertise: `You evaluate websites across industries. You know that:
- 88% of online consumers are less likely to return after a bad experience (Gomez)
- A 1-second delay in page load reduces conversions by 7% (Akamai)
- 75% of users judge credibility based on visual design (Stanford)
- Mobile accounts for 60%+ of web traffic but converts at half the desktop rate
- Clear CTAs increase conversion by 161% (HubSpot)
- 55% of visitors spend less than 15 seconds on a page (Microsoft)`,
    },
  };

  return contexts[industry] || contexts.general;
}

// ─── Page Type Context ──────────────────────────────────────────────

function getPageTypeContext(pageType: PageType): string {
  const contexts: Record<string, string> = {
    "Landing Page": `This is a LANDING PAGE. The #1 job is to convert visitors into leads or signups.
Key evaluation criteria:
- Can you understand what they offer in 5 seconds? (5-second test)
- Is there ONE clear call-to-action above the fold?
- Does the headline address a specific pain point?
- Is there social proof (testimonials, logos, stats)?
- Is the page structure: Problem → Solution → Proof → CTA?
- Are there too many competing CTAs?
- Does the page build trust (credibility indicators)?`,

    "Pricing Page": `This is a PRICING PAGE. The #1 job is to help visitors choose a plan and convert.
Key evaluation criteria:
- Is the recommended plan visually highlighted?
- Are there too many plans (max 3-4)?
- Is annual vs monthly toggle present with savings shown?
- Is there a free tier or trial clearly shown?
- Can you compare features across plans easily?
- Is pricing hidden behind "Contact Sales" unnecessarily?
- Are there trust signals (money-back guarantee, testimonials)?`,

    "Checkout": `This is a CHECKOUT PAGE. The #1 job is to complete the purchase with zero friction.
Key evaluation criteria:
- How many form fields? (benchmark: 7 or fewer)
- Is guest checkout available? (24% abandon without it)
- Are shipping costs shown? (48% abandon due to surprise costs)
- Is the order summary always visible?
- Are trust badges near the payment form?
- Is express checkout available (Apple Pay, Google Pay)?
- Does the form have inline validation?`,

    "Signup / Register": `This is a SIGNUP PAGE. The #1 job is to get users into the product with minimum friction.
Key evaluation criteria:
- How many fields before they can try the product? (benchmark: 3)
- Is social login available (Google, Apple)?
- Is the value they'll get after signup clear?
- Is there a password visibility toggle?
- Are password requirements shown upfront?
- Is there a link to login for existing users?
- Does the CTA say something specific ("Start Free Trial") not just "Submit"?`,

    "Homepage": `This is a HOMEPAGE. The #1 job is to communicate what the company does and guide visitors to the right path.
Key evaluation criteria:
- Can you understand what the company does in 5 seconds?
- Is the primary action obvious?
- Are there clear paths for different user types?
- Is the navigation simple (7 items max)?
- Is there social proof above the fold?
- Is the page professional and modern-looking?
- Does it address the target audience's pain points?`,

    "Blog / Article": `This is a BLOG/ARTICLE PAGE. The #1 job is to keep readers engaged and drive them to take action.
Key evaluation criteria:
- Is the content readable? (font size, line height, max width)
- Is there a table of contents for long articles?
- Is the author credible? (bio, credentials)
- Is there a clear CTA or next step?
- Are social sharing buttons present?
- Is there related content for continued engagement?
- Is the estimated reading time shown?`,

    "Product Page": `This is a PRODUCT PAGE. The #1 job is to convince the visitor to add to cart / buy.
Key evaluation criteria:
- Are there enough product images (5+ with zoom)?
- Is the price prominent and clear?
- Is Add to Cart above the fold?
- Are reviews visible and filterable?
- Is the return policy visible?
- Is stock/availability shown?
- Is shipping info visible before checkout?`,
  };

  return contexts[pageType as string] || contexts["Landing Page"];
}
