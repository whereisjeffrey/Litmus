/**
 * Voice-law checker — grades report copy against evals/voice-laws.json.
 *
 * The content evals (run-evals.ts) grade WHAT the pipeline finds; this grades
 * HOW it speaks (evals/VOICE-LAWS.md). Regex laws run free and offline — use
 * them in CI and during prompt work with no API credits. Judge laws run with
 * --judge when credits exist.
 *
 * Usage:
 *   npx tsx src/scripts/check-voice.ts <reportFile>            # deterministic laws on a WalkReport JSON
 *   npx tsx src/scripts/check-voice.ts --text <copyFile>       # deterministic laws on any copy file
 *   npx tsx src/scripts/check-voice.ts <reportFile> --judge    # + LLM-graded laws (needs API credits)
 *
 * Exit code 1 if any `fail`-severity law fails. `warn` laws report but don't block.
 */

import "../env";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { WalkReport } from "../agent/pipeline";

const JUDGE_MODEL = process.env.JUDGE_MODEL || "claude-sonnet-5-5";

interface VoiceCheck {
  type: "regex" | "regex-with-null-research" | "judge" | "strengths-nonempty";
  failWhen?: "match" | "absent";
  pattern?: string;
  flags?: string;
  explain?: string;
  question?: string;
  severity?: "fail" | "warn";
}
interface VoiceLaw {
  id: string;
  severity: "fail" | "warn";
  appliesTo: "finding" | "summary" | "report" | "all";
  checks: VoiceCheck[];
}

interface Unit {
  label: string;
  text: string;
  research: string | null | undefined;
}

interface Violation {
  lawId: string;
  severity: "fail" | "warn";
  unit: string;
  detail: string;
}

function loadLaws(): VoiceLaw[] {
  const file = path.join(process.cwd(), "evals", "voice-laws.json");
  return (JSON.parse(fs.readFileSync(file, "utf-8")) as { laws: VoiceLaw[] }).laws;
}

/** Customer-facing text units from a report: summary + each confirmed finding. */
function unitsFromReport(report: WalkReport): { units: Unit[]; summary: Unit; strengths: string[] } {
  const findings =
    report.adversary?.confirmed?.length > 0 ? report.adversary.confirmed : report.synthesis.findings;
  const units: Unit[] = findings.map((f, i) => ({
    label: `finding[${i}] "${f.headline.slice(0, 50)}"`,
    text: [f.headline, f.narrative, f.recommendation].join("\n"),
    research: f.research,
  }));
  const summary: Unit = { label: "summary", text: report.synthesis.summary, research: undefined };
  return { units, summary, strengths: report.synthesis.strengths ?? [] };
}

function runDeterministic(
  laws: VoiceLaw[],
  findingUnits: Unit[],
  summary: Unit,
  strengths: string[] | null
): Violation[] {
  const violations: Violation[] = [];
  for (const law of laws) {
    const targets: Unit[] =
      law.appliesTo === "finding" ? findingUnits
      : law.appliesTo === "summary" ? [summary]
      : law.appliesTo === "all" ? [...findingUnits, summary]
      : []; // "report" handled per-check below

    for (const check of law.checks) {
      const severity = check.severity ?? law.severity;
      if (check.type === "regex" || check.type === "regex-with-null-research") {
        const re = new RegExp(check.pattern!, check.flags || "");
        for (const u of targets) {
          const matched = re.test(u.text);
          const researchGate = check.type === "regex-with-null-research" ? u.research == null : true;
          const violated =
            check.failWhen === "match" ? matched && researchGate : !matched && researchGate;
          if (violated) {
            const m = matched ? u.text.match(re)?.[0] : null;
            violations.push({
              lawId: law.id,
              severity,
              unit: u.label,
              detail: `${check.explain}${m ? ` — matched: "${m.slice(0, 60)}"` : ""}`,
            });
          }
        }
      } else if (check.type === "strengths-nonempty" && strengths !== null) {
        if (strengths.length === 0 && findingUnits.length > 0) {
          violations.push({
            lawId: law.id,
            severity,
            unit: "report",
            detail: check.explain ?? "no strengths listed",
          });
        }
      }
      // judge checks handled in runJudge
    }
  }
  return violations;
}

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["lawId", "unit", "compliant", "reasoning"],
        properties: {
          lawId: { type: "string" },
          unit: { type: "string" },
          compliant: { type: "boolean" },
          reasoning: { type: "string" },
        },
      },
    },
  },
} as const;

async function runJudge(laws: VoiceLaw[], findingUnits: Unit[], summary: Unit): Promise<Violation[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const judgeLaws = laws
    .flatMap((law) =>
      law.checks
        .filter((c) => c.type === "judge")
        .map((c) => ({ law, question: c.question!, severity: c.severity ?? law.severity }))
    );
  if (judgeLaws.length === 0) return [];

  const benchmark = fs.existsSync(path.join(process.cwd(), "evals", "fixtures", "chubbies-2026-11-16.md"))
    ? fs.readFileSync(path.join(process.cwd(), "evals", "fixtures", "chubbies-2026-11-16.md"), "utf-8")
    : "(benchmark fixture missing)";

  const unitsBlock = [...findingUnits, summary]
    .map((u) => `### UNIT: ${u.label}\n${u.text}`)
    .join("\n\n");
  const lawsBlock = judgeLaws
    .map((l) => `- ${l.law.id} (appliesTo: ${l.law.appliesTo}): ${l.question}`)
    .join("\n");

  const stream = anthropic.messages.stream({
    model: JUDGE_MODEL,
    max_tokens: 12000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: JUDGE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `You grade UX-report copy against voice laws. Be strict and literal. The register benchmark below shows what compliant copy sounds like.

## Voice laws to grade
${lawsBlock}

## Register benchmark (approved copy — for calibration only)
${benchmark.slice(0, 6000)}

## Copy under review
${unitsBlock}

Grade every law against every unit it applies to ("finding" laws against finding units, "summary" against the summary, "all" against both). Return one result per (law, unit) pair with compliant true/false and one-sentence reasoning.`,
      },
    ],
  } as Anthropic.MessageStreamParams);

  const message = await stream.finalMessage();
  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) throw new Error("Judge returned no content");
  const parsed = JSON.parse(textBlock.text) as {
    results: Array<{ lawId: string; unit: string; compliant: boolean; reasoning: string }>;
  };
  return parsed.results
    .filter((r) => !r.compliant)
    .map((r) => ({
      lawId: r.lawId,
      severity: judgeLaws.find((l) => l.law.id === r.lawId)?.severity ?? "fail",
      unit: r.unit,
      detail: r.reasoning,
    }));
}

async function main() {
  const args = process.argv.slice(2);
  const laws = loadLaws();

  let findingUnits: Unit[];
  let summary: Unit;
  let strengths: string[] | null;

  const textIdx = args.indexOf("--text");
  if (textIdx !== -1) {
    const file = args[textIdx + 1];
    if (!file) throw new Error("--text requires a file path");
    const text = fs.readFileSync(file, "utf-8");
    // Text mode has no structured research field: an inline citation marker satisfies V7.
    const inlineCitation = /Baymard|Nielsen|NN\/g|\(20\d\d\)|source:/i.test(text) ? "inline" : null;
    findingUnits = [{ label: `text "${path.basename(file)}"`, text, research: inlineCitation }];
    summary = { label: "(no summary — text mode)", text: "", research: undefined };
    strengths = null;
  } else {
    const reportFile = args.find((a) => !a.startsWith("--"));
    if (!reportFile) {
      console.log("Usage: check-voice.ts <reportFile> [--judge] | --text <copyFile>");
      return;
    }
    const report: WalkReport = JSON.parse(fs.readFileSync(reportFile, "utf-8"));
    ({ units: findingUnits, summary, strengths } = unitsFromReport(report));
  }

  let violations = runDeterministic(laws, findingUnits, summary, strengths);
  if (args.includes("--judge")) {
    violations = violations.concat(await runJudge(laws, findingUnits, summary));
  } else {
    console.log("(deterministic laws only — add --judge for LLM-graded laws V1b/V2/V3b/V5b/V6b/V8/V10b)\n");
  }

  const fails = violations.filter((v) => v.severity === "fail");
  const warns = violations.filter((v) => v.severity === "warn");

  console.log(`──── VOICE CHECK ────`);
  console.log(`Units checked: ${findingUnits.length} finding(s) + summary`);
  console.log(`FAIL: ${fails.length}   warn: ${warns.length}\n`);
  for (const v of [...fails, ...warns]) {
    console.log(`  [${v.severity.toUpperCase()}] ${v.lawId} @ ${v.unit}`);
    console.log(`         ${v.detail}`);
  }
  if (violations.length === 0) console.log("  all voice laws passed ✓");

  if (fails.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Voice check failed:", err);
  process.exit(1);
});
