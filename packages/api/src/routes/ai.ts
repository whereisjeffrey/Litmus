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

// ─── Knowledge base rules (hardcoded for runtime access) ───────────

const CHECKOUT_RULES = `
- Minimize form field count. Benchmark is 7 fields across 3 steps. Each additional field reduces completion by ~10%. (Baymard Institute)
- Guest checkout must be available. 24% of users abandon when forced to create an account.
- Use single column form layout. Multi-column layouts produce 22% more errors (CXL Institute).
- Inline validation reduces errors by 22% and increases completion by 31%.
- Error messages must be specific and placed near the problematic field. 67% of users who encounter confusing errors abandon.
- Auto-format credit card numbers with spaces. Numbers without spaces cause 30% more typos.
- Multi-step checkout needs a progress indicator. Users who see progress are 20% more likely to complete.
- Show order summary at all times during checkout. Users who can't see their cart abandon 12% more.
- Trust signals (security badges, SSL) near payment fields reduce abandonment by 42%.
- Offer multiple payment methods. 9% of users abandon if their preferred payment method isn't available.
`;

const LANDING_RULES = `
- Value proposition must be clear within 5 seconds. Unclear value props are the #1 reason landing pages fail (Unbounce).
- Single primary CTA visible above the fold. Pages with one CTA have 13.5% higher conversion than pages with multiple CTAs.
- Headline should address a pain point. Problem-focused headlines convert 28% better than product-descriptive ones.
- Subheadline should explain "how." Subheadlines that explain mechanism generate 30% more engagement.
- Hero image/video must be relevant to value prop. Relevant hero images increase conversion by 40% vs generic stock.
- No slider/carousel in hero. Only 1% of users interact with carousels (Notre Dame study).
- CTA text should be specific and action-oriented ("Start Free Trial" not "Submit").
- Social proof (testimonials, logos, stats) should be present. Pages with social proof convert 34% higher.
- Remove navigation distractions. Landing pages without nav links convert 100% better (VWO study).
- Page load under 3 seconds. Each second of delay reduces conversion by 7%.
- Mobile-responsive layout. 60%+ of landing page traffic is mobile.
- Benefit-focused copy over feature lists. Benefits answer "so what?" for the visitor.
`;

const SIGNUP_RULES = `
- Minimize fields to essentials (email + password minimum). Each extra field reduces signups by 5-10%.
- Social login options reduce friction by 50%+ for returning users.
- Password requirements shown upfront, not after submission.
- Show/hide password toggle increases completion by 15%.
- Autocomplete attributes let browsers pre-fill, reducing friction by 30%.
- Clear value reminder near the form — remind users what they're signing up for.
- Best-in-class signup forms use 3-5 fields maximum.
- Real-time email validation prevents typos in the most critical field.
`;

const UNIVERSAL_RULES = `
- Color contrast must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). 1 in 12 men have color vision deficiency.
- All images need alt text. Missing alt makes images invisible to screen readers and hurts SEO.
- Form fields need associated labels. Placeholder text alone is not sufficient.
- Heading hierarchy must be sequential (H1 > H2 > H3). Screen readers use headings for navigation.
- Touch targets must be 44x44px minimum. Smaller targets cause mis-taps on mobile.
- Page must have a single H1 element. Multiple H1s dilute focus for search engines.
- Meta description 150-160 characters for optimal search result display.
- Open Graph tags needed for social media sharing previews.
- Language attribute on <html> tag required for screen reader pronunciation.
- Focus indicators must be visible for keyboard navigation.
`;

function getKnowledgeBaseRules(pageType: string): string {
  const pt = pageType.toLowerCase();
  let rules = UNIVERSAL_RULES;

  if (pt.includes("checkout")) {
    rules += "\nCheckout-specific rules:\n" + CHECKOUT_RULES;
  } else if (pt.includes("landing") || pt.includes("homepage")) {
    rules += "\nLanding page-specific rules:\n" + LANDING_RULES;
  } else if (pt.includes("signup") || pt.includes("register") || pt.includes("login")) {
    rules += "\nSignup/Login-specific rules:\n" + SIGNUP_RULES;
  } else if (pt.includes("pricing")) {
    rules += `\nPricing page-specific rules:
- Highlight a recommended plan. Pages that highlight a plan see 20% higher conversion.
- Offer annual/monthly toggle. Annual plans save customers 15-20% on average.
- Use comparison tables for feature clarity.
- Show pricing in visitor's currency when possible.
- Include FAQ section to address objections.
`;
  } else if (pt.includes("product")) {
    rules += `\nProduct page-specific rules:
- Use 4-8 product images including lifestyle shots and zoom views.
- Products with customer reviews convert 270% better.
- Show clear pricing and availability above the fold.
- Include trust signals near the Add to Cart button.
- Size/variant selection must be clear before add to cart.
`;
  }

  return rules;
}

// ─── Prompt Builder ────────────────────────────────────────────────

function buildAnalysisPrompt(
  scanData: AnalyzeRequestBody["scanData"],
  pageType: string,
  url: string
): string {
  // Summarize findings by category
  const categorySummary = scanData.categories
    .map((cat) => `  - ${cat.name}: score ${Math.round(cat.score)}/100, ${cat.findingsCount} findings`)
    .join("\n");

  // Count by severity
  const criticalCount = scanData.allFindings.filter((f) => f.severity === "critical").length;
  const warningCount = scanData.allFindings.filter((f) => f.severity === "warning").length;
  const infoCount = scanData.allFindings.filter((f) => f.severity === "info").length;

  // Top 10 most impactful findings
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const topFindings = [...scanData.allFindings]
    .sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2))
    .slice(0, 10)
    .map((f) => `  - [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`)
    .join("\n");

  const knowledgeRules = getKnowledgeBaseRules(pageType);

  return `You are a senior UX consultant analyzing a website. You provide specific, actionable insights based on real scan data. You speak in plain English that a CEO or product manager would understand. Every recommendation includes WHY it matters to the business, not just what's wrong technically.

You are analyzing: ${url}
Page type detected: ${pageType}

Scan Results Summary:
- Overall Score: ${scanData.overallScore}/100
- ${criticalCount} critical issues, ${warningCount} warnings, ${infoCount} info items
- Category breakdown:
${categorySummary}

Key findings:
${topFindings}

Relevant best practices and benchmarks:
${knowledgeRules}

Respond with ONLY valid JSON in this exact format, no other text:
{
  "hookLine": "One punchy sentence about the most impactful finding on THIS specific page. Always include a specific number.",
  "storyCards": [
    {
      "category": "Accessibility|UX Heuristics|Forms|Content|Performance",
      "headline": "A problem-focused sentence, not just the category name",
      "narrative": "2-3 sentences explaining why this matters to the business. Include specific numbers from the scan. Reference research when relevant.",
      "impact": "critical|high|medium|low",
      "topIssues": ["Issue 1", "Issue 2", "Issue 3"]
    }
  ],
  "quickWins": [
    {
      "title": "Short action title",
      "description": "One sentence explaining what to do",
      "estimatedTime": "~X minutes",
      "impact": "High|Medium"
    }
  ],
  "pageInsights": [
    "Insight 1 specific to this page type",
    "Insight 2"
  ]
}

Rules for your response:
- Maximum 5 story cards
- Maximum 3 quick wins
- Maximum 3 page insights
- Every headline must be specific to THIS page, not generic
- Every narrative must include at least one specific number from the scan data
- Quick wins should be the easiest, highest-impact fixes
- Focus on business impact, not technical details
- If the page is a checkout, focus on conversion and abandonment
- If the page is a landing page, focus on conversion and clarity
- If the page is a signup, focus on friction and completion rates`;
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
  Accessibility: "accessibility",
  "UX Heuristics": "ux",
  Forms: "forms",
  Content: "content",
  Performance: "performance",
};

function parseAnalysisResponse(text: string) {
  // Try to extract JSON from the response (handle markdown code blocks)
  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from the response
    const textBlock = response.content.find((block) => block.type === "text");
    const responseText = textBlock && textBlock.type === "text" ? textBlock.text : "";

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
