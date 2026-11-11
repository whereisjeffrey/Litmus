/**
 * Eval runner — scores a pipeline report against the golden set.
 *
 * An LLM judge matches the report's findings against each case's `expected`
 * (recall) and `forbidden` (trap) lists. Trap-avoidance is reported
 * separately: it is the metric this product lives or dies on.
 *
 * Usage:
 *   npx tsx src/scripts/run-evals.ts --list
 *       List golden-set cases.
 *   npx tsx src/scripts/run-evals.ts <caseId> <reportFile>
 *       Judge a report (from .data/reports/) against a case. Needs API credits.
 *   npx tsx src/scripts/run-evals.ts <caseId> <reportFile> --offline
 *       No API call: print the case and report side-by-side for manual scoring.
 */

import "../env";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { WalkReport } from "../agent/pipeline";

const JUDGE_MODEL = process.env.JUDGE_MODEL || "claude-sonnet-5";

interface GoldenCase {
  id: string;
  url: string;
  pageType: string;
  industry: string;
  task: string;
  expected: Array<{ finding: string; whyItMatters?: string }>;
  forbidden: Array<{ element: string; naiveHeuristic: string; whyCorrect: string }>;
  provenance: string;
}

interface GoldenSet {
  version: number;
  cases: GoldenCase[];
}

interface JudgeResult {
  expectedResults: Array<{ index: number; found: boolean; matchedHeadline: string | null; reasoning: string }>;
  forbiddenResults: Array<{ index: number; flagged: boolean; matchedHeadline: string | null; reasoning: string }>;
}

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["expectedResults", "forbiddenResults"],
  properties: {
    expectedResults: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "found", "matchedHeadline", "reasoning"],
        properties: {
          index: { type: "integer" },
          found: { type: "boolean", description: "Does any report finding substantively match this expected finding?" },
          matchedHeadline: { type: ["string", "null"] },
          reasoning: { type: "string" },
        },
      },
    },
    forbiddenResults: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "flagged", "matchedHeadline", "reasoning"],
        properties: {
          index: { type: "integer" },
          flagged: { type: "boolean", description: "Does any report finding criticize this element in the naive-heuristic way?" },
          matchedHeadline: { type: ["string", "null"] },
          reasoning: { type: "string" },
        },
      },
    },
  },
} as const;

function loadGoldenSet(): GoldenSet {
  const file = path.join(process.cwd(), "evals", "golden-set.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function findingsSummary(report: WalkReport): string {
  const confirmed = report.adversary.confirmed.length > 0
    ? report.adversary.confirmed
    : report.synthesis.findings.map((f) => ({ ...f, verdict: "UNREVIEWED" as const }));
  if (confirmed.length === 0) return "(the report contains zero findings)";
  return confirmed
    .map((f, i) => `[${i}] (${f.impact}) ${f.headline}\n    ${f.narrative}\n    Recommendation: ${f.recommendation}`)
    .join("\n\n");
}

async function judge(goldenCase: GoldenCase, report: WalkReport): Promise<JudgeResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const expectedBlock = goldenCase.expected.length
    ? goldenCase.expected.map((e, i) => `[${i}] ${e.finding}`).join("\n")
    : "(none defined)";
  const forbiddenBlock = goldenCase.forbidden.length
    ? goldenCase.forbidden
        .map((f, i) => `[${i}] Element: ${f.element}\n    The trap (naive heuristic): ${f.naiveHeuristic}\n    Why the design is actually correct: ${f.whyCorrect}`)
        .join("\n")
    : "(none defined)";

  const stream = anthropic.messages.stream({
    model: JUDGE_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: JUDGE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `You are grading a UX-audit report against a golden-set case. Be strict and literal.

## Expected findings (report SHOULD catch these)
${expectedBlock}

## Forbidden findings (traps — report must NOT flag these; the design is correct)
${forbiddenBlock}

## The report's findings
${findingsSummary(report)}

For each expected finding: is it substantively present in the report (same underlying problem, wording may differ)?
For each forbidden trap: does any report finding criticize that element along the lines of the naive heuristic? A finding that mentions the element but makes a DIFFERENT, legitimate point is NOT flagged.`,
      },
    ],
  } as Anthropic.MessageStreamParams);

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) throw new Error("Judge returned no content");
  return JSON.parse(textBlock.text) as JudgeResult;
}

function printOffline(goldenCase: GoldenCase, report: WalkReport): void {
  console.log(`\n──── CASE ${goldenCase.id} (manual scoring — no API call) ────`);
  console.log(`\nExpected findings:`);
  goldenCase.expected.forEach((e, i) => console.log(`  [E${i}] ${e.finding}`));
  if (goldenCase.expected.length === 0) console.log("  (none)");
  console.log(`\nForbidden traps:`);
  goldenCase.forbidden.forEach((f, i) => console.log(`  [F${i}] ${f.element}\n       trap: ${f.naiveHeuristic}`));
  console.log(`\nReport findings:\n\n${findingsSummary(report)}`);
  console.log(`\nScore manually: recall = E-found/E-total; any F flagged = trap failure.`);
}

async function main() {
  const args = process.argv.slice(2);
  const goldenSet = loadGoldenSet();

  if (args.includes("--list") || args.length === 0) {
    console.log("Golden-set cases:\n");
    for (const c of goldenSet.cases) {
      console.log(`  ${c.id}`);
      console.log(`    ${c.pageType} / ${c.industry} — ${c.expected.length} expected, ${c.forbidden.length} trap(s)`);
    }
    console.log(`\nUsage: npx tsx src/scripts/run-evals.ts <caseId> <reportFile> [--offline]`);
    return;
  }

  const [caseId, reportFile] = args.filter((a) => !a.startsWith("--"));
  const goldenCase = goldenSet.cases.find((c) => c.id === caseId);
  if (!goldenCase) throw new Error(`Unknown case: ${caseId} (use --list)`);
  if (!reportFile) throw new Error("Provide a report file from .data/reports/");

  const report: WalkReport = JSON.parse(fs.readFileSync(reportFile, "utf-8"));

  if (args.includes("--offline")) {
    printOffline(goldenCase, report);
    return;
  }

  const result = await judge(goldenCase, report);

  const found = result.expectedResults.filter((r) => r.found).length;
  const trapsFailed = result.forbiddenResults.filter((r) => r.flagged);

  console.log(`\n──── EVAL: ${goldenCase.id} ────`);
  console.log(`Recall: ${found}/${goldenCase.expected.length || "n/a"}`);
  for (const r of result.expectedResults) {
    console.log(`  [E${r.index}] ${r.found ? "✓ found" : "✗ missed"}${r.matchedHeadline ? ` — "${r.matchedHeadline}"` : ""}`);
  }
  console.log(`\nTrap avoidance: ${trapsFailed.length === 0 ? "✓ PASSED" : `✗ FAILED (${trapsFailed.length})`}`);
  for (const r of result.forbiddenResults) {
    console.log(`  [F${r.index}] ${r.flagged ? "✗ FLAGGED THE TRAP" : "✓ avoided"} — ${r.reasoning.slice(0, 100)}`);
  }

  const outDir = path.join(process.cwd(), ".data", "eval-results");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${caseId}-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ caseId, reportFile, result }, null, 2));
  console.log(`\nSaved: ${outFile}`);
}

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exit(1);
});
