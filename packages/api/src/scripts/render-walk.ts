/**
 * Walk filmstrip renderer — turns a walk transcript into a single
 * self-contained HTML file (screenshots embedded as base64) you can open in
 * any browser. This is the dev-facing prototype of the customer-facing
 * "watch the session" Pro artifact.
 *
 * Usage:
 *   npx tsx src/scripts/render-walk.ts [runId]     (default: latest walk)
 *   → writes .data/walks/<runId>/filmstrip.html
 */

import * as fs from "fs";
import * as path from "path";
import { PERSONAS } from "../agent/personas";
import type { WalkResult, WalkStep } from "../agent/transcript";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const ACTION_ICONS: Record<string, string> = {
  navigate: "🧭",
  click: "👆",
  type_text: "⌨️",
  scroll: "↕️",
  finish_walk: "🏁",
};

function renderStep(step: WalkStep, runDir: string): string {
  let imgTag = "";
  if (step.screenshotFile) {
    const file = path.join(runDir, step.screenshotFile);
    if (fs.existsSync(file)) {
      const b64 = fs.readFileSync(file).toString("base64");
      imgTag = `<img src="data:image/jpeg;base64,${b64}" alt="Step ${step.step} screenshot" loading="lazy" />`;
    }
  }

  const inputEntries = Object.entries(step.input).filter(([k]) => k !== "thought");
  const inputStr = inputEntries.length
    ? `<code>${esc(inputEntries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("  "))}</code>`
    : "";

  return `
  <section class="step">
    <div class="step-meta">
      <div class="step-badge">${step.step}</div>
      <div class="step-info">
        <div class="step-action">${ACTION_ICONS[step.action] ?? "▪"} <strong>${esc(step.action)}</strong> ${inputStr}</div>
        <div class="step-url">${esc(step.url)}</div>
        <blockquote class="thought">&ldquo;${esc(step.thought)}&rdquo;</blockquote>
        ${step.observation ? `<div class="observation">⚠ ${esc(step.observation)}</div>` : ""}
      </div>
    </div>
    ${imgTag}
  </section>`;
}

export function renderWalkHtml(walk: WalkResult, runDir: string): string {
  const persona = PERSONAS[walk.persona];
  const personaLabel = persona?.label ?? walk.persona;
  const durationSec =
    walk.finishedAt && walk.startedAt ? Math.round((walk.finishedAt - walk.startedAt) / 1000) : null;
  const outcome =
    walk.taskCompleted === true
      ? `<span class="pill pill-good">Task completed</span>`
      : walk.taskCompleted === false
        ? `<span class="pill pill-bad">Did not complete</span>`
        : `<span class="pill">Unknown outcome</span>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Walk session — ${esc(personaLabel)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; color: #0f172a; }
  .wrap { max-width: 860px; margin: 0 auto; padding: 24px 16px 64px; }
  header { background: #0f172a; color: #e2e8f0; border-radius: 14px; padding: 20px 22px; margin-bottom: 22px; }
  header h1 { font-size: 18px; margin: 0 0 6px; }
  header .sub { font-size: 13px; color: #94a3b8; line-height: 1.5; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #334155; color: #cbd5e1; margin-right: 6px; }
  .pill-good { background: #065f46; color: #d1fae5; }
  .pill-bad { background: #7f1d1d; color: #fee2e2; }
  .summary { background: #fff; border-radius: 14px; padding: 16px 18px; margin-bottom: 22px; border: 1px solid #e2e8f0; }
  .summary h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px; }
  .summary p { margin: 0; font-size: 14px; line-height: 1.6; font-style: italic; color: #334155; }
  .step { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 18px; overflow: hidden; }
  .step-meta { display: flex; gap: 14px; padding: 14px 16px; }
  .step-badge { flex-shrink: 0; width: 28px; height: 28px; border-radius: 999px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
  .step-info { min-width: 0; }
  .step-action { font-size: 13px; }
  .step-action code { background: #f1f5f9; border-radius: 6px; padding: 1px 6px; font-size: 11px; color: #475569; }
  .step-url { font-size: 11px; color: #94a3b8; margin-top: 3px; word-break: break-all; }
  .thought { margin: 8px 0 0; padding: 8px 12px; border-left: 3px solid #2563eb; background: #eff6ff; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.5; color: #1e3a5f; font-style: italic; }
  .observation { margin-top: 8px; font-size: 12px; color: #b45309; background: #fffbeb; border-radius: 8px; padding: 6px 10px; }
  .step img { display: block; width: 100%; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Session replay — ${esc(personaLabel)}</h1>
    <div class="sub">
      Task: ${esc(walk.task)}<br/>
      ${esc(walk.startUrl)} · ${walk.steps.length} steps${durationSec !== null ? ` · ${durationSec}s` : ""} · simulated participant
    </div>
    <div style="margin-top:10px">${outcome}</div>
  </header>

  ${walk.summary ? `<div class="summary"><h2>Participant's own summary</h2><p>&ldquo;${esc(walk.summary)}&rdquo;</p></div>` : ""}

  ${walk.steps.map((s) => renderStep(s, runDir)).join("\n")}
</div>
</body>
</html>`;
}

function main() {
  const walksDir = path.join(process.cwd(), ".data", "walks");
  const runs = fs.readdirSync(walksDir).filter((d) => d.startsWith("walk-")).sort();
  const runId = process.argv[2] || runs[runs.length - 1];
  if (!runId) throw new Error(`No walks found in ${walksDir}`);

  const runDir = path.join(walksDir, runId);
  const walk: WalkResult = JSON.parse(fs.readFileSync(path.join(runDir, "transcript.json"), "utf-8"));

  const html = renderWalkHtml(walk, runDir);
  const outFile = path.join(runDir, "filmstrip.html");
  fs.writeFileSync(outFile, html);
  console.log(`Filmstrip written: ${outFile} (${Math.round(html.length / 1024)} KB)`);
}

// Only run as a script, not when imported
if (process.argv[1]?.endsWith("render-walk.ts")) {
  main();
}
