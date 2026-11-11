/**
 * Scripted walk harness test — verifies the browser mechanics (session,
 * guardrails, tools, transcript, screenshots) with zero AI tokens.
 *
 * Usage:
 *   npx tsx src/scripts/test-walk.ts [url]
 *
 * Defaults to books.toscrape.com — a public demo store that's safe to walk.
 * For an LLM-driven walk (requires ANTHROPIC_API_KEY + credits):
 *   npx tsx src/scripts/test-walk.ts --llm [url] "[task]"
 */

import "../env";
import { runScriptedWalk, runLlmWalk } from "../agent/walk-runner";
import { PERSONAS } from "../agent/personas";

async function main() {
  const args = process.argv.slice(2);
  const useLlm = args.includes("--llm");
  const positional = args.filter((a) => a !== "--llm");
  const url = positional[0] || "https://books.toscrape.com/";
  const task = positional[1] || "Find a book that interests you and get to its detail page with the price visible.";

  if (useLlm) {
    console.log(`LLM walk: ${url}\nTask: ${task}\n`);
    const result = await runLlmWalk({ startUrl: url, task, persona: PERSONAS["busy-professional"] });
    printResult(result);
    return;
  }

  console.log(`Scripted walk: ${url}\n`);
  const result = await runScriptedWalk(
    { startUrl: url, task },
    [
      {
        tool: "scroll",
        input: { direction: "down", thought: "Let me see what's on this page below the first screen." },
      },
      {
        tool: "scroll",
        input: { direction: "up", thought: "Back to the top to look at the main options." },
      },
      {
        tool: "click",
        input: {
          selector: "h3 a",
          description: "The first product link I can see",
          thought: "This looks like a product — I'll open it to check the details.",
        },
      },
      {
        tool: "navigate",
        input: { url: "https://example.com/", thought: "(guardrail test: leaving the site should be refused)" },
      },
      {
        tool: "finish_walk",
        input: {
          task_completed: true,
          summary: "Scripted run: mechanics exercised — scroll, click-through to a detail page, and one blocked off-site navigation.",
          thought: "Done.",
        },
      },
    ]
  );
  printResult(result);
}

function printResult(result: import("../agent/transcript").WalkResult) {
  console.log(`\n─── Walk ${result.runId} ───`);
  console.log(`Persona: ${result.persona} | Completed: ${result.taskCompleted}`);
  console.log(`Steps: ${result.steps.length}`);
  for (const s of result.steps) {
    console.log(`  ${s.step}. [${s.action}] ${s.thought.slice(0, 70)}${s.observation ? ` → ⚠ ${s.observation.slice(0, 60)}` : ""}`);
  }
  console.log(`Summary: ${result.summary}`);
  console.log(`Artifacts: .data/walks/${result.runId}/`);
}

main().catch((err) => {
  console.error("Walk failed:", err);
  process.exit(1);
});
