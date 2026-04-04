import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const aiRoutes = new Hono();

// ─── Types for the request body ────────────────────────────────────

interface ScanFinding {
  scanner: string;
  severity: string;
  title: string;
  description: string;
}

interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  findingsCount: number;
}

interface AnalyzeRequestBody {
  scanData: {
    overallScore: number;
    pageType: string;
    categories: CategoryScore[];
    allFindings: ScanFinding[];
  };
  pageType: string;
  url: string;
}

// ─── Industry Detection ─────────────────────────────────────────────

const INDUSTRY_SIGNALS: Record<string, { keywords: string[]; urlPatterns: string[] }> = {
  saas: {
    keywords: ["free trial", "pricing", "enterprise", "integrations", "api", "dashboard", "workflow", "automation", "saas", "subscribe", "plan", "tier", "per month", "per user", "onboarding", "demo", "features"],
    urlPatterns: ["app.", "dashboard.", "admin."],
  },
  ecommerce: {
    keywords: ["add to cart", "buy now", "checkout", "shipping", "free shipping", "product", "shop", "store", "price", "sale", "discount", "size", "color", "quantity", "review", "wishlist", "returns"],
    urlPatterns: ["shop.", "store.", "products/", "collections/"],
  },
  fintech: {
    keywords: ["banking", "investment", "portfolio", "loan", "mortgage", "interest rate", "apr", "credit score", "account", "transfer", "payment", "fintech", "insurance", "crypto", "trading"],
    urlPatterns: ["bank.", "finance.", "invest.", "pay."],
  },
  medical: {
    keywords: ["patient", "doctor", "appointment", "health", "medical", "clinic", "hospital", "pharmacy", "hipaa", "provider", "telehealth", "symptoms"],
    urlPatterns: ["health.", "medical.", "patient.", "care."],
  },
  "professional-services": {
    keywords: ["attorney", "lawyer", "law firm", "accounting", "cpa", "consulting", "advisory", "practice areas", "case study", "consultation", "expertise"],
    urlPatterns: ["law.", "legal.", "consult."],
  },
  "real-estate": {
    keywords: ["listing", "property", "real estate", "home", "house", "apartment", "rent", "buy", "sell", "mortgage", "mls", "bedrooms", "agent", "broker", "virtual tour"],
    urlPatterns: ["realty.", "homes.", "property."],
  },
};

function detectIndustry(url: string, pageType: string, findings: ScanFinding[]): string {
  const allText = `${url} ${pageType} ${findings.map(f => f.title + " " + f.description).join(" ")}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [industry, signals] of Object.entries(INDUSTRY_SIGNALS)) {
    let score = 0;
    for (const keyword of signals.keywords) {
      if (allText.includes(keyword)) score += 1;
    }
    for (const pattern of signals.urlPatterns) {
      if (url.toLowerCase().includes(pattern)) score += 3;
    }
    scores[industry] = score;
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return sorted[0][1] >= 3 ? sorted[0][0] : "general";
}

// ─── Industry Expertise Context ─────────────────────────────────────

function getIndustryExpertise(industry: string): string {
  const expertise: Record<string, string> = {
    saas: `You specialize in SaaS. Key benchmarks:
- Free trial conversion: 15-25% (Totango)
- Each signup field removed: +10% conversion (Imagescape)
- 55% of visitors spend <15 seconds on page (Microsoft)
- Transparent pricing companies grow 2x faster (OpenView)
- Single CTA pages: 13.5% conversion vs 2.8% for 5+ CTAs (Unbounce)
- Onboarding completion: top quartile hits 80% (Userpilot)`,
    ecommerce: `You specialize in e-commerce. Key benchmarks:
- Cart abandonment: 70.19% average (Baymard 2023)
- 24% abandon when forced to create account (Baymard)
- 48% abandon due to surprise costs (shipping, tax)
- Guest checkout increases conversion 45% (Baymard)
- Product pages with 5+ images: +40% conversion (Shopify)
- Return policy visibility reduces abandonment 17% (UPS/comScore)`,
    fintech: `You specialize in fintech. Key benchmarks:
- 81% say trust is deciding factor (Edelman)
- Security badges: +42% conversion (Blue Fountain Media)
- KYC abandonment: 40-50% for complex flows (Signicat)
- Financial calculators: +3x time-on-site, +25% conversion (HubSpot)
- 41% switch banks due to poor UX (J.D. Power)`,
    medical: `You specialize in healthcare. Key benchmarks:
- 77% search before booking appointment (Google Health)
- Online scheduling: +24% bookings (Accenture)
- 88% consider online reviews for providers (Software Advice)
- HIPAA violations: $100-$50,000 per incident
- 60% will switch providers for better digital experience (NRC Health)`,
    "professional-services": `You specialize in professional services. Key benchmarks:
- 75% judge credibility by website design (Stanford)
- Case studies generate 70% more leads (CMI)
- Online booking: +30% intake conversion (Clio)
- 80% of buyers check credentials before contact (Hinge)
- Specialized firms grow 8x faster than generalists (Hinge)`,
    "real-estate": `You specialize in real estate. Key benchmarks:
- 97% of buyers use internet in search (NAR 2023)
- Virtual tours: +87% more views (Realtor.com)
- 76% found home on mobile device (NAR)
- Properties with 20+ photos sell 32% faster (Redfin)
- Agent video intros: +403% more inquiries (BombBomb)`,
    general: `You evaluate websites across industries. Key benchmarks:
- 88% less likely to return after bad experience (Gomez)
- 1-second load delay: -7% conversions (Akamai)
- 75% judge credibility by design (Stanford)
- Clear CTAs: +161% conversion (HubSpot)
- 55% spend <15 seconds on page (Microsoft)`,
  };
  return expertise[industry] || expertise.general;
}

// ─── Page Type Context ──────────────────────────────────────────────

function getPageContext(pageType: string): string {
  const pt = pageType.toLowerCase();
  if (pt.includes("landing") || pt.includes("homepage")) return "The #1 job: convert visitors into leads/signups. Evaluate: 5-second clarity, CTA design, social proof, persuasion structure.";
  if (pt.includes("pricing")) return "The #1 job: help visitors choose a plan. Evaluate: plan highlighting, comparison clarity, annual toggle, trust signals.";
  if (pt.includes("checkout")) return "The #1 job: complete the purchase with zero friction. Evaluate: field count (7 max), guest checkout, shipping transparency, trust badges.";
  if (pt.includes("signup") || pt.includes("register")) return "The #1 job: get users into the product. Evaluate: field count (3 max), social login, immediate value delivery.";
  if (pt.includes("product")) return "The #1 job: convince visitor to buy. Evaluate: images (5+), price prominence, reviews, return policy visibility.";
  if (pt.includes("blog") || pt.includes("article")) return "The #1 job: keep readers engaged and drive action. Evaluate: readability, CTAs, social sharing, content structure.";
  if (pt.includes("dashboard") || pt.includes("app")) return "The #1 job: help users accomplish tasks efficiently. Evaluate: empty states, onboarding, navigation, loading states.";
  return "Evaluate this page for business impact: clarity, conversion potential, trust signals, user experience.";
}

// ─── Prompt Builder ────────────────────────────────────────────────

function buildAnalysisPrompt(
  scanData: AnalyzeRequestBody["scanData"],
  pageType: string,
  url: string
): string {
  const industry = detectIndustry(url, pageType, scanData.allFindings);
  const industryExpertise = getIndustryExpertise(industry);
  const pageContext = getPageContext(pageType);

  // Summarize findings by category
  const categorySummary = scanData.categories
    .map((cat) => `  - ${cat.name}: score ${Math.round(cat.score)}/100, ${cat.findingsCount} findings`)
    .join("\n");

  // Count by severity
  const criticalCount = scanData.allFindings.filter((f) => f.severity === "critical").length;
  const warningCount = scanData.allFindings.filter((f) => f.severity === "warning").length;
  const infoCount = scanData.allFindings.filter((f) => f.severity === "info").length;

  // Top 15 most impactful findings
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const topFindings = [...scanData.allFindings]
    .sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2))
    .slice(0, 15)
    .map((f) => `  - [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`)
    .join("\n");

  return `You are a senior UX consultant who specializes in ${industry === "general" ? "digital businesses" : industry.replace("-", " ")} companies. A client has hired you to evaluate their ${pageType} and identify the issues most likely costing them money and customers.

You are NOT a technical auditor. You are a business consultant. Your job is to tell the CEO what's wrong in language they care about: revenue, customers, competitive advantage, growth.

## Your Industry Expertise
${industryExpertise}

## Page Context
${pageContext}

## The Client's Page
URL: ${url}
Page Type: ${pageType}
Detected Industry: ${industry}
Overall Score: ${scanData.overallScore}/100

Category breakdown:
${categorySummary}

Severity: ${criticalCount} critical, ${warningCount} warnings, ${infoCount} info

Top findings from automated scan:
${topFindings}

## Your Task

Identify the 3-5 issues most likely COSTING THIS BUSINESS MONEY OR CUSTOMERS. Frame every insight as a business problem, not a technical one.

## Rules

1. NEVER use technical jargon in headlines. No "WCAG", "alt text", "meta tag", "heading hierarchy", "contrast ratio". Those are engineer terms.
2. Every headline must make a CEO lean forward. It must imply money lost or customers lost.
3. Every impact statement must include a SPECIFIC research citation with source name and year.
4. Do NOT include trivial issues. Missing alt text on a decorative image is not CEO-level. A broken signup flow IS.
5. Rank by estimated business impact. The biggest money-loser goes first.
6. Be specific to THIS page. Reference actual findings from the scan data.
7. If the page is actually good (85+), say so. Don't manufacture problems.
8. Group related technical issues into one business-impact card. "12 missing alt texts + 3 contrast issues" = one "Legal Risk" card, not two.
9. Frame accessibility under "Legal Risk" (ADA lawsuits cost $10K-$50K) or "Customer Experience" (users literally can't use your site).

## Output Format

Respond with ONLY valid JSON, no markdown, no explanation:

{
  "hookLine": "One sentence that makes a CEO stop scrolling. Use a specific number from the scan. Frame as business problem, not technical issue.",
  "storyCards": [
    {
      "category": "Growth Blockers|Customer Experience|Conversion Friction|Brand & Trust|Legal Risk",
      "headline": "Plain English. Examples: 'Your signup process is turning away customers', 'Mobile visitors are getting a broken experience', 'Your checkout is creating doubt'",
      "narrative": "2-3 sentences a CEO would understand. Explain what this is costing them. Include a research citation with source name. Connect to revenue, growth, or customer retention.",
      "impact": "critical|high|medium|low",
      "topIssues": ["Business-framed issue with research stat", "Another issue with specific number", "Third issue tied to business outcome"]
    }
  ],
  "quickWins": [
    {
      "title": "Action a product manager would assign today",
      "description": "What to do and what business result to expect. Include a stat.",
      "estimatedTime": "~X minutes",
      "impact": "High|Medium"
    }
  ],
  "pageInsights": [
    "Strategic insight specific to this page and industry",
    "Another insight connecting findings to business outcomes"
  ]
}

LIMITS: Max 5 storyCards, max 3 quickWins, max 3 pageInsights. First 2 storyCards are visible to free users, rest are locked for Pro.`;
}

// ─── Response Parser ───────────────────────────────────────────────

interface ClaudeStoryCard {
  category: string;
  headline: string;
  narrative: string;
  impact: "critical" | "high" | "medium" | "low";
  topIssues: string[];
}

interface ClaudeQuickWin {
  title: string;
  description: string;
  estimatedTime: string;
  impact: string;
}

interface ClaudeAnalysisResponse {
  hookLine: string;
  storyCards: ClaudeStoryCard[];
  quickWins: ClaudeQuickWin[];
  pageInsights: string[];
}

const CATEGORY_TO_ICON: Record<string, string> = {
  // Business-focused categories (from new prompt)
  "Growth Blockers": "performance",
  "Customer Experience": "ux",
  "Conversion Friction": "forms",
  "Brand & Trust": "security",
  "Legal Risk": "accessibility",
  // Legacy technical categories (fallback)
  Accessibility: "accessibility",
  "UX Heuristics": "ux",
  Forms: "forms",
  Content: "content",
  Performance: "performance",
};

function parseAnalysisResponse(text: string) {
  let jsonStr = text.trim();

  // Always extract JSON by finding first { and last }
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }
  const parsed: ClaudeAnalysisResponse = JSON.parse(jsonStr);

  // Map story cards to our StoryCard type with generated IDs and iconTypes
  const storyCards = (parsed.storyCards || []).slice(0, 5).map((card, index) => ({
    id: `ai-story-${index}-${card.category.toLowerCase().replace(/\s+/g, "-")}`,
    headline: card.headline,
    narrative: card.narrative,
    impact: card.impact,
    category: card.category,
    findingCount: card.topIssues?.length || 0,
    topFindings: card.topIssues || [],
    iconType: (CATEGORY_TO_ICON[card.category] || "security") as
      "accessibility" | "ux" | "forms" | "content" | "performance" | "security",
  }));

  // Map quick wins
  const quickWins = (parsed.quickWins || []).slice(0, 3).map((qw) => ({
    title: qw.title,
    description: qw.description,
    estimatedTime: qw.estimatedTime,
    impact: qw.impact,
    category: "",
  }));

  return {
    hookLine: parsed.hookLine || "",
    storyCards,
    quickWins,
    pageInsights: (parsed.pageInsights || []).slice(0, 3),
  };
}

// ─── Route Handler ─────────────────────────────────────────────────

aiRoutes.post("/analyze", async (c) => {
  try {
    const body = await c.req.json<AnalyzeRequestBody>();
    const { scanData, pageType, url } = body;

    if (!scanData || !pageType || !url) {
      return c.json({ error: "Missing required fields: scanData, pageType, url" }, 400);
    }

    // Build the prompt with knowledge base context
    const prompt = buildAnalysisPrompt(scanData, pageType, url);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    if (!responseText) {
      return c.json({ error: "Empty response from AI" }, 500);
    }

    // Parse the response into our AIAnalysis format
    const analysis = parseAnalysisResponse(responseText);

    return c.json(analysis);
  } catch (err) {
    console.error("AI analysis error:", err);
    return c.json({ error: "AI analysis failed" }, 500);
  }
});
