/**
 * Free (zero-token) pipeline preview: loads a recorded walk transcript from
 * .data/walks and prints the exact prompts Stages C and D would send —
 * system prompt, user content, screenshot picks, and rough size stats.
 *
 * Usage:
 *   npx tsx src/scripts/preview-synthesis.ts [runId]   (default: latest walk)
 */

import * as fs from "fs";
import * as path from "path";
import {
  buildSynthesisSystemPrompt,
  buildSynthesisUserContent,
  type SynthesisResult,
} from "../agent/synthesis";
import { buildAdversaryUserPrompt } from "../agent/adversary";
import type { WalkResult } from "../agent/transcript";

function latestRunId(walksDir: string): string {
  const runs = fs.readdirSync(walksDir).filter((d) => d.startsWith("walk-")).sort();
  if (runs.length === 0) throw new Error(`No walks found in ${walksDir}`);
  return runs[runs.length - 1];
}

function main() {
  const walksDir = path.join(process.cwd(), ".data", "walks");
  const runId = process.argv[2] || latestRunId(walksDir);
  const walk: WalkResult = JSON.parse(
    fs.readFileSync(path.join(walksDir, runId, "transcript.json"), "utf-8")
  );

  // Stand-in context; a real run gets these from the scan
  const pageType = "Product Page";
  const industry = "ecommerce";

  console.log(`Previewing pipeline prompts for walk ${runId}\n${"═".repeat(60)}`);

  const systemPrompt = buildSynthesisSystemPrompt(pageType, industry);
  const userContent = buildSynthesisUserContent({
    url: walk.startUrl,
    pageType,
    industry,
    walks: [walk],
    walksBaseDir: walksDir,
  });

  const images = userContent.filter((b) => b.type === "image").length;
  const textBlocks = userContent.filter((b) => b.type === "text");
  const userText = textBlocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");

  console.log(`\n──── STAGE C · SYNTHESIS SYSTEM PROMPT (${systemPrompt.length.toLocaleString()} chars, cached) ────\n`);
  console.log(systemPrompt.slice(0, 3000));
  console.log(`\n… [${Math.max(0, systemPrompt.length - 3000).toLocaleString()} more chars — mostly knowledge base] …`);

  console.log(`\n──── STAGE C · USER CONTENT (${images} screenshot(s) + ${userText.length.toLocaleString()} chars) ────\n`);
  console.log(userText);

  // Mock synthesis result so the adversary prompt can be previewed too
  const mockSynthesis: SynthesisResult = {
    summary: "(mock)",
    strengths: [],
    findings: [
      {
        headline: "MOCK: Shoppers can't tell if search covers the whole catalog",
        narrative: "(mock finding to preview the adversary prompt shape)",
        category: "Conversion Friction",
        impact: "high",
        convergence: "single",
        evidence: [
          {
            walkRunId: walk.runId,
            step: 1,
            personaLabel: "Sam — busy professional",
            quote: walk.steps[0]?.thought ?? "(no steps)",
          },
        ],
        recommendation: "(mock)",
        research: null,
      },
    ],
  };

  const adversaryPrompt = buildAdversaryUserPrompt(mockSynthesis, [walk], {
    url: walk.startUrl,
    pageType,
    industry,
  });

  console.log(`\n──── STAGE D · ADVERSARY USER PROMPT (${adversaryPrompt.length.toLocaleString()} chars; 1 mock finding) ────\n`);
  console.log(adversaryPrompt.slice(0, 2500));

  const totalChars = systemPrompt.length + userText.length;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Rough size: ~${Math.round(totalChars / 4).toLocaleString()} text tokens + ${images} images for Stage C.`);
  console.log("No API calls were made.");
}

main();
