/**
 * Goal-Based UX Analysis route — POST /api/ai/goal-analyze
 *
 * Evaluates whether a page (or journey) achieves a SPECIFIC user goal,
 * reasoning through the behavioral-science lenses and rubric defined for
 * that goal in @placeholder/shared. Grounds its qualitative verdict in the
 * deterministic signals collected by the extension, and references real
 * page elements (anchors) so findings get accurate "Show Me" highlighting.
 */

import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  getGoal,
  type GoalAnalyzeRequest,
  type GoalAnalysisResult,
  type GoalFrictionPoint,
  type RubricScore,
  type GoalNextStepRequest,
  type GoalNextStepDecision,
  type SiteUnderstanding,
  type SiteUnderstandingRequest,
} from "@placeholder/shared";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Temporary diagnostic dump — appends each analysis's full I/O to a JSONL file. */
const DEBUG_LOG = "/tmp/litmus-goal-debug.jsonl";
function debugDump(entry: Record<string, unknown>): void {
  try {
    appendFileSync(DEBUG_LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
  } catch {
    /* ignore */
  }
}

const MODEL = "claude-sonnet-4-6";
/** Faster/cheaper model for the per-step navigation decisions. */
const NAV_MODEL = "claude-haiku-4-5-20251001";

/** Number of friction points left unlocked for free users (rest are teased). */
const FREE_UNLOCKED = 2;

/** Testing override: GOAL_UNLOCK_ALL=true reveals every friction point (no blur). */
const UNLOCK_ALL = process.env.GOAL_UNLOCK_ALL === "true";

export const goalRoutes = new Hono();

// ─── Prompt builder ─────────────────────────────────────────────────

/** Compact ground-truth context from the prior site-understanding pass. */
function siteContextBlock(su?: SiteUnderstanding): string {
  if (!su) return "";
  const lines: string[] = [];
  if (su.siteIdentity?.whatItOffers)
    lines.push(`- The site: ${su.siteIdentity.whatItOffers} (${su.siteIdentity.category || "—"}). Makes money via: ${su.siteIdentity.businessModel || "unclear"}.`);
  if (su.primaryPurpose?.primaryConversion)
    lines.push(`- Primary conversion the business wants: ${su.primaryPurpose.primaryConversion}.`);
  if (su.pageRole?.jobOfThisPage)
    lines.push(`- This page's job: ${su.pageRole.jobOfThisPage} (funnel stage: ${su.pageRole.funnelStage || "—"}).`);
  if (su.audience?.primaryPersona)
    lines.push(`- Primary user: ${su.audience.primaryPersona}.`);
  if (su.userJobs?.length)
    lines.push(`- Users are trying to: ${su.userJobs.slice(0, 3).join("; ")}.`);
  if (su.userProblems?.length)
    lines.push(`- Their anxieties/objections: ${su.userProblems.slice(0, 3).map((p) => p.problem).join("; ")}.`);
  if (su.valueProposition?.promise)
    lines.push(`- Value promise: ${su.valueProposition.promise}.`);
  if (su.categoryConventions?.broken?.length)
    lines.push(`- Category conventions this site breaks: ${su.categoryConventions.broken.slice(0, 3).join("; ")}.`);
  if (su.whatsWorking?.length)
    lines.push(`- Already working well (don't re-flag as problems): ${su.whatsWorking.slice(0, 3).join("; ")}.`);
  if (!lines.length) return "";
  return `\n## What this site is — established by a prior expert review (treat as ground-truth context)\n${lines.join("\n")}\n`;
}

function buildGoalPrompt(body: GoalAnalyzeRequest, goalLabel: string): string {
  const def = getGoal(body.goalId);

  const lensBlock = def
    ? def.psychologyLenses
        .map((l) => `- **${l.principle}** — ${l.meaning} Applied here: ${l.application}`)
        .join("\n")
    : "- Apply established UX, persuasion, and behavioral-economics principles (Hick's Law, Fitts's Law, Fogg Behavior Model, cognitive load, social proof, loss aversion, peak-end rule).";

  const rubricBlock = def
    ? def.rubric
        .map((r) => `- "${r.key}" — ${r.label} (weight ${r.weight}): ${r.description}`)
        .join("\n")
    : `- "clarity" — Clarity (weight 0.34)\n- "friction" — Friction (weight 0.33)\n- "motivation" — Motivation (weight 0.33)`;

  const signalBlock = Object.keys(body.signals).length
    ? Object.entries(body.signals)
        .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
        .join("\n")
    : "- (no deterministic signals collected)";

  const anchorBlock = body.anchors.length
    ? body.anchors.map((a) => `- key "${a.key}": ${a.label}`).join("\n")
    : "- (no anchors located — set anchorKey to null)";

  const journeyBlock = body.journey.length
    ? body.journey
        .map(
          (s) =>
            `- Step ${s.index} (${s.pageType}) ${s.url}${
              s.actionTaken ? ` → action: ${s.actionTaken}` : ""
            }`
        )
        .join("\n")
    : `- Step 0: ${body.url}`;

  // Light context only — deliberately NOT the technical findings, so the model
  // doesn't anchor on accessibility/SEO/meta issues instead of UX behavior.
  const scanBlock = body.scanData
    ? `For background only: an automated pass rated overall page polish ${body.scanData.overallScore}/100. Ignore technical/compliance details — judge purely by human behavior toward the goal.`
    : "";

  const upsideMetric = def?.upsideMetric || "conversion rate";
  const targetOutcome = def?.targetOutcome || `The user successfully achieves: "${goalLabel}".`;

  return `You are a senior conversion strategist and UX psychologist. A client wants to know one thing about this experience:

## The Goal
"${goalLabel}"

Success looks like: ${targetOutcome}
The business metric this moves: ${upsideMetric}.

You are NOT doing a generic accessibility audit. You are judging — through behavioral science — whether a real human, with limited attention and motivation, actually gets to this outcome, and what stands in their way.
${siteContextBlock(body.siteUnderstanding)}

## Behavioral lenses to reason through
${lensBlock}

## Scoring rubric (score each dimension 0-100)
${rubricBlock}

## Deterministic signals collected from the page
These are crude automated hints, NOT ground truth. Where a signal disagrees with what you can plainly see in the screenshots, trust the screenshots.
${signalBlock}

## Identifying the primary call-to-action — read carefully
The single most important element on this page is whatever achieves ${
    body.siteUnderstanding?.primaryPurpose?.primaryConversion
      ? `the site's established primary conversion: "${body.siteUnderstanding.primaryPurpose.primaryConversion}"`
      : "the goal above"
  }. Identify that primary action by LOOKING AT THE SCREENSHOTS — it is often a prominent search box, hero input, or large button near the top, not necessarily a labelled button. A search bar can be the primary CTA. Do NOT decide what the primary CTA is from the anchor labels below; the anchors are crude auto-detected guesses and are frequently wrong (they may point at a footer link, an app-download badge, or miss the real CTA entirely). Trust your eyes and the stated conversion over any anchor label.

## Page elements you may reference for highlighting (anchors)
These are UNVERIFIED candidate elements, auto-detected and possibly mislabeled. Use an anchorKey ONLY when the element it points to genuinely matches the friction point you're describing. If the right element isn't in this list, or you're not sure the anchor points at the thing you mean, set "anchorKey" to null — a missing highlight is far better than highlighting the wrong element.
${anchorBlock}

## Journey observed
${journeyBlock}

## Standard scan context
${scanBlock}

## Your task
${
  body.journey.length > 1
    ? `This is a MULTI-STEP JOURNEY of ${body.journey.length} pages the user clicked through toward the goal. Evaluate the WHOLE FLOW: friction at each step, where momentum breaks, how many clicks it really took, and whether each step kept the user moving. Set each friction point's "journeyStep" to the step index where it occurs.`
    : `Evaluate this single page against the goal. Set every friction point's "journeyStep" to 0.`
}
1. Score each rubric dimension 0-100 with a one-sentence rationale grounded in the signals/screenshots.
2. Identify 4-8 friction points — concrete things working against the goal. Rank by impact on the goal (blockers first).
3. For each friction point, state the human behaviour at play (plain English), give a quantified upside estimate, and 2-3 specific fixes.
4. State the single biggest blocker and a projected aggregate upside if the top fixes are applied.

## Rules
- This is a UX and human-behavior analysis ONLY. Do NOT raise accessibility, SEO, meta tags, alt text, colour contrast, heading structure, page speed, or any technical/compliance issue — those are handled elsewhere and are not what the client wants here. Every finding must be about how a real person thinks, feels, decides, and moves toward the goal.
- Write for a smart non-expert. NO jargon anywhere in titles or diagnoses. The "lens" field must be a short, plain-English statement of the human behaviour at play (e.g. "People freeze when given too many choices" or "Surprise costs feel like a betrayal") — NOT an academic term. Put any formal name only in "principleName".
- Be specific to THIS page and goal. Reference what's actually on the page. No generic filler.
- Upside estimates must be realistic ranges tied to ${upsideMetric}, e.g. "+12-18% ${upsideMetric}". Cite a known benchmark source where natural (Baymard, Nielsen Norman, Unbounce).
- Diagnoses and fixes should talk about users, attention, motivation, trust, and effort — not HTML, code, or standards.
- If the experience is genuinely strong for this goal, say so and score high — don't manufacture problems.

## Output — respond with ONLY valid JSON, no markdown:
{
  "verdict": "one-sentence verdict on how well this serves the goal",
  "primaryBlocker": "the single biggest thing between the user and the goal",
  "projectedUpside": "aggregate upside headline if top fixes applied, e.g. '+20-30% ${upsideMetric}'",
  "rubricScores": [
    { "dimension": "<rubric key>", "score": 0, "rationale": "one sentence" }
  ],
  "frictionPoints": [
    {
      "title": "plain-English friction point a non-expert instantly gets",
      "lens": "short plain-English statement of the human behaviour at play (no jargon)",
      "principleName": "optional formal name for reference/hover, e.g. 'Hick's Law' (may be empty)",
      "diagnosis": "what's happening and why it hurts the goal, in everyday language (1-2 sentences)",
      "dimension": "<rubric key it maps to>",
      "severity": "blocker|major|minor",
      "journeyStep": 0,
      "anchorKey": "<anchor key or null>",
      "estimatedUpside": "+X-Y% ${upsideMetric}",
      "fixes": ["specific fix 1", "specific fix 2"]
    }
  ]
}`;
}

// ─── Response parsing ───────────────────────────────────────────────

interface RawFriction {
  title: string;
  lens: string;
  principleName?: string;
  diagnosis: string;
  dimension: string;
  severity: "blocker" | "major" | "minor";
  journeyStep?: number;
  anchorKey: string | null;
  estimatedUpside: string;
  fixes: string[];
}

interface RawResponse {
  verdict: string;
  primaryBlocker: string;
  projectedUpside: string;
  rubricScores: RubricScore[];
  frictionPoints: RawFriction[];
}

function extractJson(text: string): string {
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && first < last) s = s.substring(first, last + 1);
  return s.replace(/```/g, "");
}

const SEVERITY_RANK: Record<string, number> = { blocker: 0, major: 1, minor: 2 };

function buildResult(
  raw: RawResponse,
  body: GoalAnalyzeRequest,
  goalLabel: string
): GoalAnalysisResult {
  const def = getGoal(body.goalId);
  const anchorMap = new Map(body.anchors.map((a) => [a.key, a.selector]));

  // Weighted goal score from rubric scores (fall back to equal weights).
  const rubricScores = raw.rubricScores || [];
  let goalScore = 0;
  if (def && rubricScores.length) {
    let weightSum = 0;
    for (const dim of def.rubric) {
      const rs = rubricScores.find((r) => r.dimension === dim.key);
      if (rs) {
        goalScore += rs.score * dim.weight;
        weightSum += dim.weight;
      }
    }
    goalScore = weightSum > 0 ? Math.round(goalScore / weightSum) : 0;
  } else if (rubricScores.length) {
    goalScore = Math.round(
      rubricScores.reduce((s, r) => s + r.score, 0) / rubricScores.length
    );
  }

  // Sort friction points by severity, then gate: first N unlocked, rest teased.
  const sorted = [...(raw.frictionPoints || [])].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3)
  );

  const frictionPoints: GoalFrictionPoint[] = sorted.map((f, i) => {
    const locked = UNLOCK_ALL ? false : i >= FREE_UNLOCKED;
    // Teaser integrity: redact the actual value (diagnosis, fixes, element
    // location) for locked points server-side so it never reaches the client.
    // Only the headline, lens, severity, and quantified upside are sent.
    return {
      id: `goal-${body.goalId}-${i}`,
      title: f.title,
      lens: f.lens,
      principleName: f.principleName || undefined,
      diagnosis: locked ? "" : f.diagnosis,
      dimension: f.dimension,
      severity: f.severity,
      selector: locked ? null : f.anchorKey ? anchorMap.get(f.anchorKey) ?? null : null,
      journeyStep: f.journeyStep ?? 0,
      estimatedUpside: f.estimatedUpside,
      fixes: locked ? [] : f.fixes || [],
      locked,
    };
  });

  const entry = body.journey[0];

  return {
    goalId: body.goalId,
    goalLabel,
    goalScore,
    verdict: raw.verdict || "",
    primaryBlocker: raw.primaryBlocker || "",
    rubricScores,
    frictionPoints,
    journey: body.journey.map((s) => ({
      ...s,
      frictionPointIds: s.index === (entry?.index ?? 0)
        ? frictionPoints.map((f) => f.id)
        : [],
    })),
    projectedUpside: raw.projectedUpside || "",
    detectedIndustry: body.industry || "general",
  };
}

// ─── Route handler ──────────────────────────────────────────────────

goalRoutes.post("/goal-analyze", async (c) => {
  try {
    const body = await c.req.json<GoalAnalyzeRequest>();

    if (!body.goalId || !body.url) {
      return c.json({ error: "Missing required fields: goalId, url" }, 400);
    }

    const def = getGoal(body.goalId);
    const goalLabel =
      body.goalId === "custom"
        ? (body.customGoal || "").trim() || "Custom goal"
        : def?.label || body.goalId;

    if (body.goalId === "custom" && !body.customGoal?.trim()) {
      return c.json({ error: "customGoal is required when goalId is 'custom'" }, 400);
    }

    const prompt = buildGoalPrompt(body, goalLabel);

    // Attach screenshots from every journey step (full-page slices included),
    // each labelled so the model can tie visual observations to the right step.
    const MAX_IMAGES = 8;
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
    let imageCount = 0;
    for (const step of body.journey) {
      const shots = step.screenshots?.length
        ? step.screenshots
        : step.screenshot
        ? [step.screenshot]
        : [];
      shots.forEach((shot, i) => {
        if (imageCount >= MAX_IMAGES) return;
        content.push({
          type: "text",
          text: `Screenshot — step ${step.index} (${step.pageType}) ${step.url}${
            shots.length > 1 ? ` [view ${i + 1}/${shots.length}, top→bottom]` : ""
          }:`,
        });
        content.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: shot.replace(/^data:image\/\w+;base64,/, "") },
        });
        imageCount++;
      });
    }
    content.push({
      type: "text",
      text:
        (imageCount > 0
          ? "Judge the screenshots above as a real, distracted human pursuing the goal would.\n\n"
          : "") + prompt,
    });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    if (!text) return c.json({ error: "Empty response from AI" }, 500);

    const raw = JSON.parse(extractJson(text)) as RawResponse;
    const result = buildResult(raw, body, goalLabel);

    debugDump({
      kind: "goal-analyze",
      goalId: body.goalId,
      customGoal: body.customGoal,
      url: body.url,
      scope: body.journey.length > 1 ? "journey" : "page",
      signals: body.signals,
      anchors: body.anchors, // includes the deterministically-chosen "primaryCta" + its selector
      journey: body.journey.map((s) => ({ index: s.index, url: s.url, pageType: s.pageType, actionTaken: s.actionTaken })),
      siteUnderstanding: body.siteUnderstanding
        ? {
            primaryConversion: body.siteUnderstanding.primaryPurpose?.primaryConversion,
            jobOfThisPage: body.siteUnderstanding.pageRole?.jobOfThisPage,
          }
        : null,
      rawFrictionPoints: raw.frictionPoints, // carries anchorKey → which anchor the model called the CTA
      result: {
        goalScore: result.goalScore,
        verdict: result.verdict,
        primaryBlocker: result.primaryBlocker,
        frictionPoints: result.frictionPoints.map((f) => ({ title: f.title, selector: f.selector, severity: f.severity })),
      },
    });

    return c.json(result);
  } catch (err) {
    console.error("Goal analysis error:", err);
    return c.json({ error: "Goal analysis failed" }, 500);
  }
});

// ─── Journey navigation: decide the next click ──────────────────────

function buildNextStepPrompt(body: GoalNextStepRequest, goalLabel: string): string {
  const def = getGoal(body.goalId);
  const target = def?.targetOutcome || `The user achieves: "${goalLabel}".`;

  const candidates = body.navCandidates
    .map((c) => `- ${c.key}: "${c.text}"${c.aboveFold ? " (above the fold)" : ""}`)
    .join("\n");

  const signals = Object.entries(body.signals)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(", ");

  return `You are navigating a website to reach a goal, one click at a time, like a focused user.

## Goal
"${goalLabel}" — success means: ${target}

## Where you are
- Step ${body.stepIndex}. Current URL: ${body.url}
- Already visited: ${body.visited.join(" → ") || "(none)"}
- Page signals: ${signals || "(none)"}

## Clickable options on this page
${candidates || "(none found)"}

## Decide the SINGLE next click that best advances toward the goal.
Rules:
- If THIS page is already the goal destination (e.g. for a checkout goal, you have reached the payment/checkout page), respond "arrived".
- NEVER choose an option that completes a purchase, submits payment, places an order, deletes, or logs out. Stop and respond "arrived" when you reach that point — you map the path TO it, never through it.
- Avoid options that lead to pages already visited, or that wander away from the goal (footer links, social media, unrelated nav).
- If nothing here plausibly advances the goal, respond "stuck".

Respond with ONLY valid JSON:
{ "decision": "click|arrived|stuck", "candidateKey": "<the key, or null>", "actionLabel": "Clicked '<text>'", "reason": "one short sentence" }`;
}

goalRoutes.post("/goal-next-step", async (c) => {
  try {
    const body = await c.req.json<GoalNextStepRequest>();
    if (!body.goalId || !body.url) {
      return c.json({ error: "Missing required fields: goalId, url" }, 400);
    }

    const def = getGoal(body.goalId);
    const goalLabel =
      body.goalId === "custom"
        ? (body.customGoal || "").trim() || "Custom goal"
        : def?.label || body.goalId;

    const prompt = buildNextStepPrompt(body, goalLabel);
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
    if (body.screenshot) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: body.screenshot.replace(/^data:image\/\w+;base64,/, "") },
      });
      content.push({ type: "text", text: "Screenshot of the current page:\n\n" + prompt });
    } else {
      content.push({ type: "text", text: prompt });
    }

    const message = await anthropic.messages.create({
      model: NAV_MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    const raw = JSON.parse(extractJson(text)) as GoalNextStepDecision;

    // Validate the chosen candidate actually exists; otherwise treat as stuck.
    if (raw.decision === "click") {
      const exists = body.navCandidates.some((cc) => cc.key === raw.candidateKey);
      if (!exists) {
        return c.json({ decision: "stuck", reason: "Chosen option was not available." } satisfies GoalNextStepDecision);
      }
    }

    return c.json(raw);
  } catch (err) {
    console.error("Goal next-step error:", err);
    return c.json({ decision: "stuck", reason: "Navigation decision failed." } satisfies GoalNextStepDecision, 200);
  }
});

// ─── Site understanding (pre-analysis comprehension pass) ───────────

const FALLBACK_UNDERSTANDING_PROMPT = `You are a Design Director. Build an accurate, evidence-grounded model of this site — what it is, how it makes money, its primary conversion, who uses it, their jobs and anxieties, its value proposition, structure, category conventions, what's working, and what you cannot know. Comprehension, not critique. Respond with ONLY valid JSON matching the SiteUnderstanding shape.`;

let cachedBasePrompt: string | null = null;

/** Load the Design Director prompt from knowledge/site-understanding.md (single source of truth). */
function siteUnderstandingBasePrompt(): string {
  if (cachedBasePrompt) return cachedBasePrompt;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const md = readFileSync(resolve(here, "../../../../knowledge/site-understanding.md"), "utf8");
    const marker = "## The Prompt";
    const idx = md.indexOf(marker);
    cachedBasePrompt = idx >= 0 ? md.slice(idx + marker.length).trim() : md.trim();
  } catch (err) {
    console.warn("[site-understanding] could not read knowledge file, using fallback:", err);
    cachedBasePrompt = FALLBACK_UNDERSTANDING_PROMPT;
  }
  return cachedBasePrompt;
}

goalRoutes.post("/site-understanding", async (c) => {
  try {
    const body = await c.req.json<SiteUnderstandingRequest>();
    if (!body.url) return c.json({ error: "Missing required field: url" }, 400);

    const signals = body.signals
      ? Object.entries(body.signals)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(", ")
      : "(none)";

    const context = `\n\n## This page (the evidence)\n- URL: ${body.url}\n- Title: ${body.title || "(unknown)"}\n- Best-guess page type: ${body.pageType || "(unknown)"}\n- Structural signals: ${signals}\n\nKeep every value concise — one sentence each, arrays at most 4 items. The JSON must be COMPLETE and valid (no trailing/truncated output).`;

    const prompt = siteUnderstandingBasePrompt() + context;

    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
    const shots = (body.screenshots || []).slice(0, 6);
    shots.forEach((shot, i) => {
      content.push({ type: "text", text: `Screenshot ${i + 1}/${shots.length} (top→bottom):` });
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: shot.replace(/^data:image\/\w+;base64,/, "") },
      });
    });
    content.push({ type: "text", text: prompt });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    if (!text) return c.json({ error: "Empty response from AI" }, 500);

    const understanding = JSON.parse(extractJson(text)) as SiteUnderstanding;
    debugDump({
      kind: "site-understanding",
      url: body.url,
      pageType: body.pageType,
      signals: body.signals,
      primaryConversion: understanding.primaryPurpose?.primaryConversion,
      jobOfThisPage: understanding.pageRole?.jobOfThisPage,
      primaryPersona: understanding.audience?.primaryPersona,
    });
    return c.json(understanding);
  } catch (err) {
    console.error("Site understanding error:", err);
    return c.json({ error: "Site understanding failed" }, 500);
  }
});
