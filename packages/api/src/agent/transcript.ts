import * as fs from "fs";
import * as path from "path";

/**
 * Transcript — the record of a walk session.
 *
 * This is the product's qualitative data: per step it stores the action, the
 * persona's think-aloud narration, and a screenshot of what they saw. The
 * expert synthesis stage (and eventually the report UI's session filmstrip)
 * consume this artifact.
 */

export interface WalkStep {
  step: number;
  action: string;
  input: Record<string, unknown>;
  /** The persona's think-aloud narration for this action */
  thought: string;
  url: string;
  title: string;
  /** Relative filename of the post-action screenshot within the run dir */
  screenshotFile: string | null;
  /** What the harness observed after the action (errors, guardrail refusals) */
  observation?: string;
  timestamp: number;
}

export interface WalkResult {
  runId: string;
  persona: string;
  task: string;
  startUrl: string;
  startedAt: number;
  finishedAt: number | null;
  taskCompleted: boolean | null;
  /** The persona's closing summary of the experience */
  summary: string | null;
  steps: WalkStep[];
}

export class Transcript {
  private result: WalkResult;
  readonly runDir: string;

  constructor(opts: { personaId: string; task: string; startUrl: string; baseDir?: string }) {
    const runId = `walk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const baseDir = opts.baseDir || path.join(process.cwd(), ".data", "walks");
    this.runDir = path.join(baseDir, runId);
    fs.mkdirSync(this.runDir, { recursive: true });

    this.result = {
      runId,
      persona: opts.personaId,
      task: opts.task,
      startUrl: opts.startUrl,
      startedAt: Date.now(),
      finishedAt: null,
      taskCompleted: null,
      summary: null,
      steps: [],
    };
  }

  addStep(entry: {
    action: string;
    input: Record<string, unknown>;
    thought: string;
    url: string;
    title: string;
    screenshot: Buffer | null;
    observation?: string;
  }): WalkStep {
    const stepNumber = this.result.steps.length + 1;
    let screenshotFile: string | null = null;

    if (entry.screenshot) {
      screenshotFile = `step-${String(stepNumber).padStart(3, "0")}.jpeg`;
      fs.writeFileSync(path.join(this.runDir, screenshotFile), entry.screenshot);
    }

    const step: WalkStep = {
      step: stepNumber,
      action: entry.action,
      input: entry.input,
      thought: entry.thought,
      url: entry.url,
      title: entry.title,
      screenshotFile,
      observation: entry.observation,
      timestamp: Date.now(),
    };
    this.result.steps.push(step);
    this.save();
    return step;
  }

  finish(summary: string, taskCompleted: boolean): WalkResult {
    this.result.summary = summary;
    this.result.taskCompleted = taskCompleted;
    this.result.finishedAt = Date.now();
    this.save();
    return this.result;
  }

  get data(): WalkResult {
    return this.result;
  }

  private save(): void {
    fs.writeFileSync(
      path.join(this.runDir, "transcript.json"),
      JSON.stringify(this.result, null, 2)
    );
  }
}
