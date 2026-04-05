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
  screenshot?: string; // base64 data URL of the page
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

// ─── Customer Persona ─────────────────────────────────────────────

function getCustomerPersona(industry: string, pageType: string): string {
  const personas: Record<string, string> = {
    "real-estate": "A first-time homebuyer in their 30s looking for a 3-bedroom house. You want to search by neighborhood, see photos, and contact an agent. You're comparing 3-4 real estate sites right now.",
    ecommerce: "A busy professional shopping online during their lunch break. You know roughly what you want but need to find it quickly, compare options, and checkout without friction. You'll abandon if it takes more than 2 minutes.",
    saas: "A VP of Operations evaluating software tools for your 50-person team. You have 15 minutes to decide if this product is worth a demo. You need to understand what it does, how much it costs, and whether companies like yours use it.",
    fintech: "A 35-year-old professional looking to open a new account or apply for a financial product. You're cautious about security, need to understand fees clearly, and will leave immediately if something feels untrustworthy.",
    medical: "A patient looking for a new healthcare provider. You want to find a doctor, check their credentials, read reviews, and book an appointment online. You're slightly anxious and need reassurance.",
    "professional-services": "A business owner who needs legal/accounting/consulting help. You want to understand their expertise, see proof they've helped companies like yours, and book a consultation. You're comparing 3 firms.",
    general: "A potential customer visiting this website for the first time. You found it through a Google search or a friend's recommendation. You have 30 seconds to decide if this site has what you need.",
  };
  return personas[industry] || personas.general;
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

  return `LOOK AT THE SCREENSHOT. That is a real website. You are visiting it right now as a potential customer for the first time.

You are this person:
${getCustomerPersona(industry, pageType)}

You have 30 seconds. What do you see? What confuses you? What would make you leave? What's missing?

DO NOT talk about code, HTML, JavaScript errors, alt text, contrast ratios, meta tags, or any technical scan findings. IGNORE the technical data below unless it directly relates to something you can SEE in the screenshot that would affect a real customer.

## What to evaluate (LOOK AT THE SCREENSHOT for each one):

1. FIRST IMPRESSION: Within 5 seconds, can you tell what this company does and why you should care? Is the headline specific or generic fluff?

2. FINDING WHAT YOU NEED: Can you easily find the main action? (search for properties, add to cart, sign up, book appointment) Is it obvious or buried?

3. TRUST: Would you give this company your money or personal information? Do you see testimonials, reviews, credentials, security indicators? Or does it feel anonymous?

4. NAVIGATION: Does the menu make sense? Are labels in YOUR language (the customer's) or in company jargon? Can you find pricing, contact, help?

5. MESSAGING: Is the copy compelling or forgettable? Does it talk about YOUR problems or just list THEIR features? Is there too much text or not enough?

6. VISUAL DESIGN: Does this look like a company you'd trust with your money? Does it look modern or outdated? Is the layout clean or cluttered?

7. MOBILE: If this were on a phone, would it work? Are buttons big enough? Is text readable?

8. WHAT'S MISSING: What would you EXPECT to see on a ${industry === "general" ? "" : industry.replace("-", " ") + " "}website that isn't here?

## Industry context
${industryExpertise}

## URL: ${url}
## Page type: ${pageType}

## Background technical data (DO NOT lead with this — only mention if it connects to something you SEE)
Score: ${scanData.overallScore}/100. ${criticalCount} critical issues, ${warningCount} warnings found by automated scan.

## CRITICAL INSTRUCTIONS

- Your response must be based on what you SEE IN THE SCREENSHOT, not the technical scan data
- Write like you're talking to the CEO: "Your homepage doesn't tell visitors what you do" NOT "Missing H1 heading tag"
- Every insight must reference something VISIBLE in the screenshot — a specific section, element, image, text, or missing element
- Include research citations where relevant (Baymard Institute, Nielsen Norman Group, NAR, etc.)
- If you can't see the screenshot clearly, still evaluate based on what you can determine from the URL and page type
- DO NOT mention JavaScript errors, missing alt text, heading hierarchy, form labels, autocomplete attributes, or any HTML-level issues unless they cause something visually broken that a customer would notice

## TONE RULES (CRITICAL — follow these exactly)

- You are a supportive advisor, not a harsh critic. Think "trusted consultant gently pointing out opportunities."
- NEVER use negative words like "fluff," "lazy," "terrible," "fails," "awful," "weak," "poor," "bad," "pathetic," "mediocre," "ugly," "broken," "useless"
- Frame every issue as an OPPORTUNITY, not a failure: "You could strengthen this by..." NOT "This is wrong"
- ALWAYS lead with something positive before the suggestion. "Your design looks clean and professional. To build on that, consider adding..."
- Use "consider" and "opportunity" language: "You might consider..." / "There's an opportunity to..." / "One thing that could strengthen this..."
- When citing stats, frame as UPSIDE POTENTIAL, not current loss: "Companies that add guest checkout typically see 24% more completions" NOT "You're losing 24% of customers"
- NEVER assume intent or mock decisions: "Mobile visitors may be having a different experience" NOT "You clearly didn't think about mobile"
- The reader should feel MOTIVATED to take action, not embarrassed about their site
- The hookLine should be encouraging but honest: "Your site has strong potential — here are 3 opportunities that could significantly boost conversions" NOT "Your site has major problems"

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

  // Strip markdown code fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Extract JSON by finding first { and last }
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  // Remove any remaining backticks that might be inside
  jsonStr = jsonStr.replace(/```/g, "");

  console.log("[AI] Parsing response, length:", jsonStr.length, "starts with:", jsonStr.substring(0, 50));
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
    const { scanData, pageType, url, screenshot } = body;

    if (!scanData || !pageType || !url) {
      return c.json({ error: "Missing required fields: scanData, pageType, url" }, 400);
    }

    // Build the prompt with knowledge base context
    const prompt = buildAnalysisPrompt(scanData, pageType, url);

    // Build message content — text + screenshot if available
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (screenshot) {
      // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Data,
        },
      });
      content.push({
        type: "text",
        text: "Above is a screenshot of the page I want you to evaluate. Look at it carefully as a potential customer would.\n\n" + prompt,
      });
      console.log("[AI] Sending screenshot + prompt to Claude vision");
    } else {
      content.push({ type: "text", text: prompt });
      console.log("[AI] Sending text-only prompt to Claude (no screenshot)");
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content }],
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
