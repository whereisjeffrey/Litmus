import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { loadKnowledge } from "../lib/knowledge";
import { PERSONAS } from "./personas";
import type { WalkResult } from "./transcript";

/**
 * Stage C — Expert Synthesis.
 *
 * The senior-consultant pass: reads the walkers' session transcripts (plus
 * optional scanner data), maps observations to knowledge-base rules, and
 * produces candidate findings. Findings are CANDIDATES until Stage D
 * (adversary.ts) confirms them.
 *
 * Design rules carried from docs/03: personas discover, the expert
 * interprets. Convergence across personas is the severity/confidence signal.
 * Every finding must quote the session evidence it rests on.
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Synthesis is where intelligence is bought — Opus tier by default (docs/03 §3)
const SYNTHESIS_MODEL = process.env.SYNTHESIS_MODEL || "claude-opus-4-8";

export interface SynthesisInput {
  url: string;
  pageType: string;
  industry: string;
  walks: WalkResult[];
  /** Optional deterministic scanner summary (score, top findings) */
  scanSummary?: string;
  /** Base dir where walk run dirs live (for loading step screenshots) */
  walksBaseDir?: string;
}

export interface EvidenceRef {
  walkRunId: string;
  step: number;
  personaLabel: string;
  quote: string;
}

export interface CandidateFinding {
  headline: string;
  narrative: string;
  category: "Growth Blockers" | "Customer Experience" | "Conversion Friction" | "Brand & Trust" | "Legal Risk";
  impact: "critical" | "high" | "medium" | "low";
  /** all-personas | multiple | single | expert-only — convergence is the confidence signal */
  convergence: string;
  evidence: EvidenceRef[];
  recommendation: string;
  /** Research citation drawn from the knowledge base, if one applies */
  research: string | null;
}

export interface SynthesisResult {
  summary: string;
  strengths: string[];
  findings: CandidateFinding[];
}

// ─── Prompts ───────────────────────────────────────────────────────

export function buildSynthesisSystemPrompt(pageType: string, industry: string): string {
  const kb = loadKnowledge(pageType, industry);
  const kbSection = kb.pageTypeRules || kb.industryRules
    ? `## Knowledge base — research-backed rules
Apply a rule ONLY when the session evidence in front of you supports it. When you cite research, cite it from these rules — never free-recall statistics.
${kb.pageTypeRules ? `\n### Page-type playbook\n${kb.pageTypeRules}` : ""}
${kb.industryRules ? `\n### Industry playbook\n${kb.industryRules}` : ""}`
    : "";

  return `You are a senior UX researcher synthesizing the results of a usability study. Simulated participants ("walkers") attempted real tasks on a live website while thinking aloud; you have their full session transcripts and screenshots. Your job is what a great research lead does after watching sessions: identify what the sessions actually demonstrate, separate signal from noise, and translate it into findings a founder/CEO can act on.

## How to read the sessions
- The walkers are participants, not critics. Their confusion, hesitation, wrong turns, and successes are your data. A walker's OPINION about design is weak evidence; a walker's BEHAVIOR (couldn't find X, misread Y, abandoned at Z) is strong evidence.
- **Convergence is your confidence signal.** Something every persona hit is a serious finding. Something one persona hit matters if the behavior is representative of a real segment — say which segment. You may add at most ONE "expert-only" finding not grounded in session behavior, and it must be clearly labeled as such.
- **Divergence is a finding in itself.** When personas succeeded differently (the confident user sailed through, the low-tech user abandoned), report the split explicitly — that is a segmentation insight with its own fix (progressive disclosure, plainer labels, defaults).
- **Chesterton's Fence still applies.** Before reporting a finding, articulate the strongest reason the design might be intentional. If a walker's behavior defeats that defense, say so — behavioral evidence is exactly what beats the fence.
- **Report what worked.** Moments where a walker felt oriented, reassured, or fast are strengths — list them. Accurate praise is what makes the criticism credible.
- **No quotas.** Zero findings is a valid result for a smooth session set.

## Evidence discipline
Every finding must quote the transcript: walk run, step number, persona, and their words (verbatim or tightly paraphrased). If you cannot point to a step, it is not a finding — with the single labeled expert-only exception above.

${kbSection}

## Voice
Business language for headlines and narratives — customers, revenue, trust, growth. The persona quotes carry the human texture; your narrative explains the mechanism and what to do about it. Direct, specific, never padded.`;
}

const MAX_SCREENSHOTS = 8;

/** Pick the most informative screenshots: first arrival, error steps, finish. */
function selectKeyScreenshots(walks: WalkResult[], baseDir: string): Array<{ label: string; file: string }> {
  const picks: Array<{ label: string; file: string }> = [];
  for (const walk of walks) {
    const dir = path.join(baseDir, walk.runId);
    const persona = PERSONAS[walk.persona]?.label ?? walk.persona;
    const interesting = walk.steps.filter(
      (s, i) => i === 0 || s.observation || s.action === "finish_walk"
    );
    for (const s of interesting) {
      if (!s.screenshotFile) continue;
      const file = path.join(dir, s.screenshotFile);
      if (fs.existsSync(file)) {
        picks.push({ label: `${persona} — step ${s.step} (${s.action})`, file });
      }
    }
  }
  return picks.slice(0, MAX_SCREENSHOTS);
}

export function formatWalkTranscript(walk: WalkResult): string {
  const persona = PERSONAS[walk.persona];
  const header = `### Session: ${persona?.label ?? walk.persona} (run ${walk.runId})
Task: ${walk.task}
Outcome: ${walk.taskCompleted === true ? "completed the task" : walk.taskCompleted === false ? "did NOT complete the task" : "unknown"}
Participant's closing summary: ${walk.summary ?? "(none)"}
`;
  const steps = walk.steps
    .map((s) => {
      const inputStr = Object.keys(s.input).length ? ` ${JSON.stringify(s.input)}` : "";
      const obs = s.observation ? `\n     ⚠ ${s.observation}` : "";
      return `  ${s.step}. [${s.action}${inputStr}] on ${s.url}\n     💬 "${s.thought}"${obs}`;
    })
    .join("\n");
  return `${header}\nSteps:\n${steps}`;
}

export function buildSynthesisUserContent(input: SynthesisInput): Anthropic.ContentBlockParam[] {
  const content: Anthropic.ContentBlockParam[] = [];

  const baseDir = input.walksBaseDir || path.join(process.cwd(), ".data", "walks");
  for (const shot of selectKeyScreenshots(input.walks, baseDir)) {
    content.push({ type: "text", text: `Screenshot — ${shot.label}:` });
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: fs.readFileSync(shot.file).toString("base64"),
      },
    });
  }

  const transcripts = input.walks.map(formatWalkTranscript).join("\n\n");

  content.push({
    type: "text",
    text: `## Site under study
URL: ${input.url}
Page type: ${input.pageType} | Industry: ${input.industry}

## Session transcripts (${input.walks.length} participant${input.walks.length === 1 ? "" : "s"})

${transcripts}
${input.scanSummary ? `\n## Automated scan summary (supporting data)\n${input.scanSummary}\n` : ""}
Synthesize the study now. Remember: behavior over opinion, convergence as confidence, evidence quotes for every finding.`,
  });

  return content;
}

// ─── Structured output schema ──────────────────────────────────────

export const SYNTHESIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "findings"],
  properties: {
    summary: {
      type: "string",
      description: "3-5 sentences: what the study showed overall, in plain business language",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "What demonstrably worked well in the sessions",
    },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "narrative", "category", "impact", "convergence", "evidence", "recommendation", "research"],
        properties: {
          headline: { type: "string" },
          narrative: { type: "string" },
          category: {
            type: "string",
            enum: ["Growth Blockers", "Customer Experience", "Conversion Friction", "Brand & Trust", "Legal Risk"],
          },
          impact: { type: "string", enum: ["critical", "high", "medium", "low"] },
          convergence: {
            type: "string",
            enum: ["all-personas", "multiple", "single", "expert-only"],
          },
          evidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["walkRunId", "step", "personaLabel", "quote"],
              properties: {
                walkRunId: { type: "string" },
                step: { type: "integer" },
                personaLabel: { type: "string" },
                quote: { type: "string" },
              },
            },
          },
          recommendation: { type: "string" },
          research: {
            type: ["string", "null"],
            description: "Citation from the knowledge base if one applies, else null",
          },
        },
      },
    },
  },
} as const;

// ─── Runner ────────────────────────────────────────────────────────

export async function runSynthesis(input: SynthesisInput): Promise<SynthesisResult> {
  const stream = anthropic.messages.stream({
    model: SYNTHESIS_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: buildSynthesisSystemPrompt(input.pageType, input.industry),
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: SYNTHESIS_SCHEMA },
    },
    messages: [{ role: "user", content: buildSynthesisUserContent(input) }],
  } as Anthropic.MessageStreamParams);

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) throw new Error("Synthesis returned no text content");
  return JSON.parse(textBlock.text) as SynthesisResult;
}
