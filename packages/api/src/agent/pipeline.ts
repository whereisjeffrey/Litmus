import * as fs from "fs";
import * as path from "path";
import { runLlmWalk } from "./walk-runner";
import { runSynthesis, type SynthesisResult } from "./synthesis";
import { runAdversary, type AdversaryResult } from "./adversary";
import { PERSONAS, type Persona } from "./personas";
import type { WalkResult } from "./transcript";

/**
 * The full Pro pipeline: walks → synthesis → adversary → report.
 *
 *   Stage B  N persona walks (Sonnet-tier, tool loop)     walk-runner.ts
 *   Stage C  expert synthesis over transcripts (Opus)     synthesis.ts
 *   Stage D  adversarial review, kill-the-finding (Opus)  adversary.ts
 *
 * Only CONFIRMED findings are user-facing. KILLED findings are persisted —
 * they are eval-set gold. NEEDS_EVIDENCE findings are persisted and flagged
 * (future: trigger one targeted re-walk before demotion).
 */

export interface PipelineOptions {
  url: string;
  task: string;
  pageType: string;
  industry: string;
  /** Personas to walk; default: Sam (busy) + Maria (low tech) */
  personas?: Persona[];
  scanSummary?: string;
  /** Run persona walks concurrently. Default false — sequential is politer to the target site. */
  parallelWalks?: boolean;
  /** Progress hook — stage transitions, for job-status UIs */
  onStage?: (stage: "walking" | "synthesizing" | "reviewing", detail?: string) => void;
}

export interface WalkReport {
  url: string;
  pageType: string;
  industry: string;
  task: string;
  generatedAt: number;
  walkRunIds: string[];
  synthesis: SynthesisResult;
  adversary: AdversaryResult;
}

export async function runWalkReport(opts: PipelineOptions): Promise<WalkReport> {
  const personas = opts.personas ?? [PERSONAS["busy-professional"], PERSONAS["novice-low-tech"]];

  // Stage B — persona walks (sequential by default; each walk is its own
  // browser, so parallel is safe for us — the consideration is target-site load)
  opts.onStage?.("walking", personas.map((p) => p.name).join(", "));
  let walks: WalkResult[];
  if (opts.parallelWalks) {
    console.log(`[pipeline] Walking as ${personas.map((p) => p.name).join(", ")} in parallel...`);
    walks = await Promise.all(
      personas.map((persona) => runLlmWalk({ startUrl: opts.url, task: opts.task, persona }))
    );
  } else {
    walks = [];
    for (const persona of personas) {
      console.log(`[pipeline] Walking as ${persona.label}...`);
      walks.push(await runLlmWalk({ startUrl: opts.url, task: opts.task, persona }));
    }
  }

  // Stage C — expert synthesis
  opts.onStage?.("synthesizing");
  console.log(`[pipeline] Synthesizing ${walks.length} session(s)...`);
  const synthesis = await runSynthesis({
    url: opts.url,
    pageType: opts.pageType,
    industry: opts.industry,
    walks,
    scanSummary: opts.scanSummary,
  });

  // Stage D — adversarial review
  opts.onStage?.("reviewing");
  console.log(`[pipeline] Adversary reviewing ${synthesis.findings.length} candidate finding(s)...`);
  const adversary = await runAdversary(synthesis, walks, {
    url: opts.url,
    pageType: opts.pageType,
    industry: opts.industry,
  });

  const report: WalkReport = {
    url: opts.url,
    pageType: opts.pageType,
    industry: opts.industry,
    task: opts.task,
    generatedAt: Date.now(),
    walkRunIds: walks.map((w) => w.runId),
    synthesis,
    adversary,
  };

  // Persist next to the walk artifacts
  const reportsDir = path.join(process.cwd(), ".data", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportFile = path.join(reportsDir, `report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(
    `[pipeline] Done: ${adversary.confirmed.length} confirmed, ${adversary.killed.length} killed, ` +
    `${adversary.needsEvidence.length} needs-evidence → ${reportFile}`
  );

  return report;
}
