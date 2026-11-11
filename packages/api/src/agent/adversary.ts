import Anthropic from "@anthropic-ai/sdk";
import type { CandidateFinding, SynthesisResult } from "./synthesis";
import { formatWalkTranscript } from "./synthesis";
import type { WalkResult } from "./transcript";

/**
 * Stage D — Adversarial Review.
 *
 * The opposite incentive to synthesis: this pass is rewarded for KILLING
 * findings. It plays two roles at once — the site's lead designer defending
 * the work, and a senior researcher auditing methodology. A finding ships
 * only if this pass fails to defeat it.
 *
 * Verdicts:
 *   CONFIRMED      — survives the steelman and the evidence check; ships.
 *   KILLED         — defeated; logged for the eval set, never shown to users.
 *   NEEDS_EVIDENCE — plausible but under-evidenced; triggers one targeted
 *                    re-check by a walker (future), else demoted/dropped.
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ADVERSARY_MODEL = process.env.ADVERSARY_MODEL || "claude-opus-4-8";

export type Verdict = "CONFIRMED" | "KILLED" | "NEEDS_EVIDENCE";

export interface ReviewedFinding extends CandidateFinding {
  verdict: Verdict;
  /** The strongest defense of the design the adversary constructed */
  steelman: string;
  /** Why the finding survived or died */
  verdictReasoning: string;
}

export interface AdversaryResult {
  reviewed: ReviewedFinding[];
  confirmed: ReviewedFinding[];
  killed: ReviewedFinding[];
  needsEvidence: ReviewedFinding[];
}

const ADVERSARY_SYSTEM = `You review candidate findings from a usability study before they are shown to a paying client. You wear two hats simultaneously:

1. **The site's lead designer**, defending the work. For every finding, construct the STRONGEST honest case that the design is intentional and correct for this business — real constraints, deliberate trade-offs, patterns that serve the site's actual users. Not a strawman: the best defense a smart designer would actually give. (Canonical example: a location input beside a car-marketplace search button is not "competing with the CTA" — location-first search is what makes results useful. A finding like that must die here.)

2. **A senior researcher auditing methodology.** Check each finding against its cited evidence: Does the quoted session behavior actually demonstrate the claim? Is one persona's quirk being inflated into a universal problem? Is an opinion being dressed up as behavior? Is the causal mechanism stated, or just implied? Is any research citation being used as a verdict rather than context?

## Verdicts
- **CONFIRMED** — the finding survives your best defense AND the evidence genuinely supports it. Confirming a well-evidenced finding is a success, not a failure; do not kill findings just to seem rigorous.
- **KILLED** — your steelman defeats it, or the evidence does not show what the finding claims.
- **NEEDS_EVIDENCE** — the claim is plausible and would matter, but the sessions don't demonstrate it strongly enough to show a client.

Judge each finding independently and honestly. The client's trust depends on nothing shipping that a real design lead could swat down in the first meeting.`;

export const ADVERSARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reviews"],
  properties: {
    reviews: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["findingIndex", "steelman", "verdict", "reasoning"],
        properties: {
          findingIndex: { type: "integer", description: "0-based index of the finding under review" },
          steelman: { type: "string", description: "The strongest honest defense of the design" },
          verdict: { type: "string", enum: ["CONFIRMED", "KILLED", "NEEDS_EVIDENCE"] },
          reasoning: { type: "string", description: "Why the finding survived or died" },
        },
      },
    },
  },
} as const;

interface AdversaryResponse {
  reviews: Array<{ findingIndex: number; steelman: string; verdict: Verdict; reasoning: string }>;
}

export function buildAdversaryUserPrompt(
  synthesis: SynthesisResult,
  walks: WalkResult[],
  siteContext: { url: string; pageType: string; industry: string }
): string {
  const findingsBlock = synthesis.findings
    .map((f, i) => {
      const evidence = f.evidence
        .map((e) => `      - ${e.personaLabel}, step ${e.step}: "${e.quote}"`)
        .join("\n");
      return `[${i}] (${f.impact}, ${f.convergence}) ${f.headline}
    Narrative: ${f.narrative}
    Recommendation: ${f.recommendation}
    Cited evidence:
${evidence || "      (none)"}`;
    })
    .join("\n\n");

  const transcripts = walks.map(formatWalkTranscript).join("\n\n");

  return `## Site
${siteContext.url} — ${siteContext.pageType}, ${siteContext.industry}

## Candidate findings under review
${findingsBlock}

## Full session transcripts (verify the cited evidence against these)
${transcripts}

Review every finding by index. Steelman first, then verdict.`;
}

export async function runAdversary(
  synthesis: SynthesisResult,
  walks: WalkResult[],
  siteContext: { url: string; pageType: string; industry: string }
): Promise<AdversaryResult> {
  if (synthesis.findings.length === 0) {
    return { reviewed: [], confirmed: [], killed: [], needsEvidence: [] };
  }

  const stream = anthropic.messages.stream({
    model: ADVERSARY_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: ADVERSARY_SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: ADVERSARY_SCHEMA },
    },
    messages: [
      { role: "user", content: buildAdversaryUserPrompt(synthesis, walks, siteContext) },
    ],
  } as Anthropic.MessageStreamParams);

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) throw new Error("Adversary returned no text content");
  const parsed = JSON.parse(textBlock.text) as AdversaryResponse;

  const reviewed: ReviewedFinding[] = synthesis.findings.map((finding, i) => {
    const review = parsed.reviews.find((r) => r.findingIndex === i);
    return {
      ...finding,
      verdict: review?.verdict ?? "NEEDS_EVIDENCE",
      steelman: review?.steelman ?? "(no review returned)",
      verdictReasoning: review?.reasoning ?? "(no review returned — defaulted to NEEDS_EVIDENCE)",
    };
  });

  return {
    reviewed,
    confirmed: reviewed.filter((f) => f.verdict === "CONFIRMED"),
    killed: reviewed.filter((f) => f.verdict === "KILLED"),
    needsEvidence: reviewed.filter((f) => f.verdict === "NEEDS_EVIDENCE"),
  };
}
