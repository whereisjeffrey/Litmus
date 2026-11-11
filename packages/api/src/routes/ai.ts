import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledge } from "../lib/knowledge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Consultant-report model. Override with AI_MODEL in .env:
 *   claude-opus-4-8   — quality bar (default; ~$0.15-0.40/report)
 *   claude-sonnet-5   — cheap iteration (~3-5x cheaper, intro pricing)
 *   claude-haiku-4-5  — plumbing tests only
 */
const AI_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

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

interface DomDigestEntry {
  tag: string;
  text: string;
  selector: string;
  x: number;
  y: number;
  w: number;
  h: number;
  aboveFold: boolean;
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
  /** Legacy single viewport screenshot (kept for backward compatibility) */
  screenshot?: string;
  /** Full-page capture: ordered top-to-bottom viewport segments as data URLs */
  screenshots?: string[];
  /** Simulated mobile-width (390px CSS constraint) segments, top to bottom */
  mobileScreenshots?: string[];
  /** Compact inventory of interactive/structural elements with positions */
  domDigest?: DomDigestEntry[];
  pageTitle?: string;
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

/**
 * Keyword-based industry detection. Uses page content (DOM digest text +
 * title + URL) — NOT finding descriptions, which pollute the signal with
 * scanner vocabulary. This is a pre-fetch hint; the model's own read of the
 * screenshots is the final authority (it reports detectedIndustry back).
 */
function detectIndustry(url: string, pageTitle: string, domDigest?: DomDigestEntry[]): string {
  const digestText = domDigest?.map((e) => e.text).join(" ") ?? "";
  const allText = `${url} ${pageTitle} ${digestText}`.toLowerCase();
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

// ─── Industry Background Knowledge ──────────────────────────────────

function getIndustryBackground(industry: string): string {
  const expertise: Record<string, string> = {
    saas: `SaaS background benchmarks:
- Free trial conversion: 15-25% (Totango)
- Each signup field removed: +10% conversion (Imagescape)
- Transparent pricing companies grow 2x faster (OpenView)
- Onboarding completion: top quartile hits 80% (Userpilot)`,
    ecommerce: `E-commerce background benchmarks:
- Cart abandonment: 70.19% average (Baymard 2023)
- 24% abandon when forced to create account (Baymard)
- 48% abandon due to surprise costs (shipping, tax)
- Guest checkout increases conversion 45% (Baymard)
- Return policy visibility reduces abandonment 17% (UPS/comScore)`,
    fintech: `Fintech background benchmarks:
- 81% say trust is deciding factor (Edelman)
- KYC abandonment: 40-50% for complex flows (Signicat)
- 41% switch banks due to poor UX (J.D. Power)`,
    medical: `Healthcare background benchmarks:
- 77% search before booking appointment (Google Health)
- Online scheduling: +24% bookings (Accenture)
- 88% consider online reviews for providers (Software Advice)
- 60% will switch providers for better digital experience (NRC Health)`,
    "professional-services": `Professional services background benchmarks:
- 75% judge credibility by website design (Stanford)
- Case studies generate 70% more leads (CMI)
- Online booking: +30% intake conversion (Clio)
- 80% of buyers check credentials before contact (Hinge)`,
    "real-estate": `Real estate background benchmarks:
- 97% of buyers use internet in search (NAR 2023)
- Virtual tours: +87% more views (Realtor.com)
- 76% found home on mobile device (NAR)
- Properties with 20+ photos sell 32% faster (Redfin)`,
    general: `General background benchmarks:
- 88% less likely to return after bad experience (Gomez)
- 75% judge credibility by design (Stanford)
- 55% spend <15 seconds on page (Microsoft)`,
  };
  return expertise[industry] || expertise.general;
}

// ─── Page Type Context ──────────────────────────────────────────────

function getPageContext(pageType: string): string {
  const pt = pageType.toLowerCase();
  if (pt.includes("landing") || pt.includes("homepage")) return "Primary job of this page type: convert visitors into leads/signups. Typical evaluation areas: 5-second clarity, CTA design, social proof, persuasion structure.";
  if (pt.includes("pricing")) return "Primary job: help visitors choose a plan. Typical evaluation areas: plan highlighting, comparison clarity, annual toggle, trust signals.";
  if (pt.includes("checkout")) return "Primary job: complete the purchase with minimal friction. Typical evaluation areas: field count, guest checkout, shipping transparency, trust badges.";
  if (pt.includes("signup") || pt.includes("register")) return "Primary job: get users into the product. Typical evaluation areas: field count, social login, immediate value delivery.";
  if (pt.includes("product")) return "Primary job: convince the visitor to buy. Typical evaluation areas: images, price prominence, reviews, return policy visibility.";
  if (pt.includes("blog") || pt.includes("article")) return "Primary job: keep readers engaged and drive a next action. Typical evaluation areas: readability, CTAs, content structure.";
  if (pt.includes("dashboard") || pt.includes("app")) return "Primary job: help users accomplish tasks efficiently. Typical evaluation areas: empty states, onboarding, navigation, loading states.";
  return "Evaluate against the page's actual job: clarity, conversion potential, trust, user experience.";
}

// ─── Visitor Context ────────────────────────────────────────────────

function getVisitorContext(industry: string): string {
  const personas: Record<string, string> = {
    "real-estate": "A first-time homebuyer in their 30s looking for a 3-bedroom house. They want to search by location, see photos, and contact an agent. They're comparing 3-4 real estate sites.",
    ecommerce: "A busy professional shopping online during a lunch break. They know roughly what they want, need to find it quickly, compare options, and check out without friction.",
    saas: "A VP of Operations evaluating software for a 50-person team. They have 15 minutes to decide if this is worth a demo: what it does, what it costs, who else uses it.",
    fintech: "A 35-year-old professional opening a new account or applying for a financial product. Cautious about security, needs fees explained clearly, leaves if anything feels untrustworthy.",
    medical: "A patient looking for a new healthcare provider: find a doctor, check credentials, read reviews, book online. Slightly anxious, needs reassurance.",
    "professional-services": "A business owner who needs legal/accounting/consulting help: understand expertise, see proof of results for similar companies, book a consultation. Comparing 3 firms.",
    general: "A potential customer visiting for the first time via search or a recommendation, deciding quickly whether this site has what they need.",
  };
  return personas[industry] || personas.general;
}

// ─── Prompt Builders ───────────────────────────────────────────────
//
// Split into a STABLE system prompt (role, reasoning protocol, knowledge
// base, voice — identical for every scan of the same pageType+industry,
// cached via cache_control) and a per-request user message (URL, screenshots,
// scan data). Keep volatile content out of the system blocks: any byte
// change there invalidates the prompt cache.

function buildSystemPrompt(pageType: string, industry: string): string {
  const kb = loadKnowledge(pageType, industry);

  const kbSection = kb.pageTypeRules || kb.industryRules
    ? `## Knowledge base — research-backed rules for this page type and industry

Apply these rules ONLY where the evidence in front of you supports them, and filter every rule through the reasoning protocol above (a rule that conflicts with this visitor's task does not apply). When you cite research, cite it from these rules — do not free-recall statistics from memory.

${kb.pageTypeRules ? `### Page-type playbook\n${kb.pageTypeRules}` : ""}
${kb.industryRules ? `### Industry playbook\n${kb.industryRules}` : ""}`
    : "";

  return `You are a senior UX consultant conducting an expert review of a live website. You have looked at thousands of products across industries. The client is paying for judgment, not a checklist — your report goes straight to the founder/CEO.

## The visitor you are evaluating for
${getVisitorContext(industry)}

## Page context
Page type: ${pageType} — ${getPageContext(pageType)}
Industry (heuristic — override it if the screenshots tell you otherwise): ${industry}

## Reasoning protocol — follow this for EVERY potential finding

1. **Derive the task first.** What is this visitor concretely trying to accomplish on this page? State it to yourself. Every judgment is made relative to that task — never against generic design rules alone.
2. **Chesterton's Fence.** Before criticizing any element, articulate the strongest reason a competent designer put it there. If your criticism does not survive that reason, it is not a finding. Example of the failure to avoid: flagging a location input next to a car-marketplace search button as "competing with the CTA" — location-first search is what makes the results useful; a real consultant would never flag it.
3. **Evidence or it doesn't ship.** Every finding must point to something concrete you can see: a specific element, section, text, or absence, with where it appears (which screenshot segment / position). No vibes.
4. **Benchmarks are background, not verdicts.** A statistic is never by itself proof that a design is wrong — explain the task-level mechanism ("this forces the visitor to X, which blocks their goal because Y"), then cite research if you are confident of it. If you are not certain a citation is real, state the mechanism without a citation. Never invent statistics.
5. **No quotas.** Report only findings you would defend face-to-face with the site's designer. A strong page gets a short report that says it's strong — that honesty is what makes the criticism credible. Zero story cards is an acceptable answer for an excellent page.
6. **Rank by business impact.** The thing most likely costing money or customers goes first.

## Industry background
${getIndustryBackground(industry)}

${kbSection}

## Voice
- You are a trusted consultant, not an auditor and not a cheerleader. Direct, specific, constructive.
- Business language for headlines and narratives: revenue, customers, trust, growth — not HTML attributes or WCAG codes.
- Frame problems with their consequence and their fix ("Visitors can't tell what you do within the first screen — leading with the product name instead of the outcome. Rewrite the hero headline around the visitor's problem.").
- Genuine strengths deserve mention where relevant, because accurate praise makes criticism trustworthy — but never pad, and never soften a real problem into invisibility.
- The reader should finish knowing exactly what to do next and why it matters.

## Output
Fill the provided JSON schema. Notes:
- hookLine: one sentence a CEO would stop on — the single most consequential truth about this page. Specific, not generic.
- storyCards: your defensible findings (0-5), ranked by impact. "evidence" lists the concrete observations behind the finding (element + where you saw it).
- quickWins: up to 3 actions someone could assign today, each with expected business result.
- pageInsights: up to 3 strategic observations specific to this page and industry (these may include what's working well).
- pageAssessment: your honest overall read.`;
}

function buildUserPrompt(body: AnalyzeRequestBody, segmentCount: number, mobileCount: number): string {
  const { scanData, url, domDigest } = body;

  const categorySummary = scanData.categories
    .map((cat) => `  - ${cat.name}: score ${Math.round(cat.score)}/100, ${cat.findingsCount} findings`)
    .join("\n");

  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const topFindings = [...scanData.allFindings]
    .sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2))
    .slice(0, 20)
    .map((f) => `  - [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`)
    .join("\n");

  const digestBlock = domDigest && domDigest.length > 0
    ? domDigest
        .slice(0, 150)
        .map((e) => `  ${e.tag}${e.aboveFold ? "" : " (below fold)"} @(${Math.round(e.x)},${Math.round(e.y)}) ${Math.round(e.w)}x${Math.round(e.h)} "${e.text.slice(0, 80)}"`)
        .join("\n")
    : "  (not provided)";

  return `## The page under review
URL: ${url}

## Your evidence
1. ${segmentCount > 1 ? `The ${segmentCount} desktop screenshot segments above cover the FULL page top-to-bottom` : "The screenshot above"} — the primary evidence.${mobileCount > 0 ? `
2. ${mobileCount} additional segment(s) labeled MOBILE show the page constrained to a 390px viewport. This is a CSS-width simulation, not true device emulation — treat it as an approximation: layout breaks, cramped tap targets, and content order problems visible there are real signals, but do not report pixel-perfect mobile judgments from it.` : ""}
${mobileCount > 0 ? "3" : "2"}. An inventory of the page's interactive and structural elements with positions (below).
${mobileCount > 0 ? "4" : "3"}. Automated scan data (below) — deterministic measurements. Use it as supporting evidence when it connects to something a visitor would experience; you are not obligated to mention it.

### Interactive/structural element inventory
${digestBlock}

### Automated scan summary
Overall score: ${scanData.overallScore}/100
${categorySummary}
Top findings:
${topFindings}

Conduct your expert review now, following the reasoning protocol.`;
}

// ─── Structured Output Schema ──────────────────────────────────────

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pageAssessment", "detectedIndustry", "hookLine", "storyCards", "quickWins", "pageInsights"],
  properties: {
    pageAssessment: {
      type: "string",
      enum: ["strong", "solid", "needs-work", "struggling"],
      description: "Honest overall read of the page",
    },
    detectedIndustry: {
      type: "string",
      description: "The industry you actually observe in the screenshots (may correct the heuristic)",
    },
    hookLine: { type: "string" },
    storyCards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "headline", "narrative", "impact", "evidence", "topIssues"],
        properties: {
          category: {
            type: "string",
            enum: ["Growth Blockers", "Customer Experience", "Conversion Friction", "Brand & Trust", "Legal Risk"],
          },
          headline: { type: "string", description: "Plain-English, CEO-level headline" },
          narrative: {
            type: "string",
            description: "2-3 sentences: what's happening, the task-level mechanism of why it hurts, and the fix direction",
          },
          impact: { type: "string", enum: ["critical", "high", "medium", "low"] },
          evidence: {
            type: "array",
            items: { type: "string" },
            description: "Concrete observations: element/section + where it appears (segment/position)",
          },
          topIssues: {
            type: "array",
            items: { type: "string" },
            description: "Business-framed sub-issues supporting this finding",
          },
        },
      },
    },
    quickWins: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "estimatedTime", "impact"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          estimatedTime: { type: "string" },
          impact: { type: "string", enum: ["High", "Medium"] },
        },
      },
    },
    pageInsights: { type: "array", items: { type: "string" } },
  },
} as const;

// ─── Response Mapping ──────────────────────────────────────────────

interface ClaudeStoryCard {
  category: string;
  headline: string;
  narrative: string;
  impact: "critical" | "high" | "medium" | "low";
  evidence: string[];
  topIssues: string[];
}

interface ClaudeQuickWin {
  title: string;
  description: string;
  estimatedTime: string;
  impact: string;
}

interface ClaudeAnalysisResponse {
  pageAssessment: string;
  detectedIndustry: string;
  hookLine: string;
  storyCards: ClaudeStoryCard[];
  quickWins: ClaudeQuickWin[];
  pageInsights: string[];
}

const CATEGORY_TO_ICON: Record<string, string> = {
  "Growth Blockers": "performance",
  "Customer Experience": "ux",
  "Conversion Friction": "forms",
  "Brand & Trust": "security",
  "Legal Risk": "accessibility",
};

function mapAnalysisResponse(parsed: ClaudeAnalysisResponse) {
  const storyCards = (parsed.storyCards || []).slice(0, 5).map((card, index) => ({
    id: `ai-story-${index}-${card.category.toLowerCase().replace(/\s+/g, "-")}`,
    headline: card.headline,
    narrative: card.narrative,
    impact: card.impact,
    category: card.category,
    findingCount: card.topIssues?.length || 0,
    topFindings: card.topIssues || [],
    evidence: card.evidence || [],
    iconType: (CATEGORY_TO_ICON[card.category] || "security") as
      "accessibility" | "ux" | "forms" | "content" | "performance" | "security",
  }));

  const quickWins = (parsed.quickWins || []).slice(0, 3).map((qw) => ({
    title: qw.title,
    description: qw.description,
    estimatedTime: qw.estimatedTime,
    impact: qw.impact,
    category: "",
  }));

  return {
    pageAssessment: parsed.pageAssessment || "",
    detectedIndustry: parsed.detectedIndustry || "",
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

    // Normalize screenshots: prefer the multi-segment array, fall back to legacy single
    const screenshots = (body.screenshots && body.screenshots.length > 0)
      ? body.screenshots
      : body.screenshot
        ? [body.screenshot]
        : [];

    const desktopShots = screenshots.slice(0, 6);
    const mobileShots = (body.mobileScreenshots || []).slice(0, 3);

    const industry = detectIndustry(url, body.pageTitle || "", body.domDigest);
    const systemPrompt = buildSystemPrompt(pageType, industry);
    const userPrompt = buildUserPrompt(body, desktopShots.length, mobileShots.length);

    // Interleave labeled screenshot segments, then the prompt
    const content: Anthropic.ContentBlockParam[] = [];
    const pushShots = (shots: string[], labelOf: (i: number, total: number) => string) => {
      shots.forEach((shot, i) => {
        const base64Data = shot.replace(/^data:image\/\w+;base64,/, "");
        const mediaMatch = shot.match(/^data:(image\/\w+);base64,/);
        content.push({ type: "text", text: labelOf(i, shots.length) });
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: (mediaMatch?.[1] as "image/jpeg" | "image/png") || "image/jpeg",
            data: base64Data,
          },
        });
      });
    };

    pushShots(desktopShots, (i, total) =>
      total > 1
        ? `Desktop screenshot segment ${i + 1} of ${total} (top-to-bottom order):`
        : "Screenshot of the page (desktop):"
    );
    pushShots(mobileShots, (i, total) =>
      `MOBILE (simulated 390px viewport) segment ${i + 1} of ${total}:`
    );
    content.push({ type: "text", text: userPrompt });

    console.log(`[AI] Analyzing ${url}: model=${AI_MODEL}, ${desktopShots.length} desktop + ${mobileShots.length} mobile segment(s), ${body.domDigest?.length ?? 0} digest entries, industry=${industry}`);

    // Adaptive thinking + structured outputs, streamed to avoid HTTP timeouts
    // on long thinking turns. The system prompt (role + protocol + knowledge
    // base) is stable per pageType+industry, so cache_control makes repeat
    // scans read it at ~0.1x price.
    const stream = anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: ANALYSIS_SCHEMA },
      },
      messages: [{ role: "user", content }],
    } as Anthropic.MessageStreamParams);

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      console.error("[AI] Model refused the request");
      return c.json({ error: "AI analysis was declined for this page" }, 500);
    }

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    if (!textBlock?.text) {
      return c.json({ error: "Empty response from AI" }, 500);
    }

    // Structured outputs guarantee schema-valid JSON — no fence-stripping needed
    const parsed: ClaudeAnalysisResponse = JSON.parse(textBlock.text);
    return c.json(mapAnalysisResponse(parsed));
  } catch (err) {
    console.error("AI analysis error:", err);
    return c.json({ error: "AI analysis failed" }, 500);
  }
});
