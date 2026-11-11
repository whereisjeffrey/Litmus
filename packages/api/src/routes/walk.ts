import * as fs from "fs";
import * as path from "path";
import { Hono } from "hono";
import { runWalkReport, type WalkReport, type PipelineOptions } from "../agent/pipeline";
import { PERSONAS } from "../agent/personas";
import { inferWalkTask } from "../agent/task-inference";
import { renderWalkHtml } from "../scripts/render-walk";
import type { WalkResult } from "../agent/transcript";

/**
 * Walk-report API — trigger the full pipeline (walks → synthesis → adversary)
 * over HTTP. Pipeline runs take minutes, so this is a job API:
 *
 *   POST /api/walk/report            → { jobId }        (starts the pipeline;
 *                                       task optional — inferred when absent)
 *   GET  /api/walk/report/:jobId     → { status, stage, task, report? }
 *   GET  /api/walk/personas          → available personas
 *   GET  /api/walk/filmstrip/:runId  → self-contained HTML session replay
 *
 * Jobs are in-memory for now — fine for a single dev server; move to the DB
 * when this ships (Supabase table + realtime is the natural fit).
 */

export const walkRoutes = new Hono();

type WalkStage = "planning" | "walking" | "synthesizing" | "reviewing";

interface WalkJob {
  jobId: string;
  status: "running" | "done" | "error";
  stage: WalkStage;
  /** The task the personas are attempting (inferred or caller-provided) */
  task?: string;
  personaNames: string[];
  startedAt: number;
  finishedAt?: number;
  report?: WalkReport;
  error?: string;
}

const jobs = new Map<string, WalkJob>();

interface WalkReportRequestBody {
  url: string;
  /** Optional — inferred from the page when absent */
  task?: string;
  pageType?: string;
  industry?: string;
  /** Persona ids from GET /personas; default Sam + Maria */
  personaIds?: string[];
  parallelWalks?: boolean;
}

walkRoutes.get("/personas", (c) => {
  return c.json(
    Object.values(PERSONAS).map((p) => ({
      id: p.id,
      name: p.name,
      label: p.label,
      techComfort: p.techComfort,
    }))
  );
});

walkRoutes.post("/report", async (c) => {
  const body = await c.req.json<WalkReportRequestBody>();
  if (!body.url) {
    return c.json({ error: "Missing required field: url" }, 400);
  }

  const personas = (body.personaIds ?? [])
    .map((id) => PERSONAS[id])
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const effectivePersonas =
    personas.length > 0
      ? personas
      : [PERSONAS["busy-professional"], PERSONAS["novice-low-tech"]];

  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job: WalkJob = {
    jobId,
    status: "running",
    stage: "planning",
    task: body.task,
    personaNames: effectivePersonas.map((p) => p.name),
    startedAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Fire and track — the client polls for completion
  (async () => {
    const task =
      body.task ?? (await inferWalkTask(body.url, body.pageType, body.industry));
    job.task = task;

    const opts: PipelineOptions = {
      url: body.url,
      task,
      pageType: body.pageType || "Homepage",
      industry: body.industry || "general",
      personas: effectivePersonas,
      parallelWalks: body.parallelWalks,
      onStage: (stage) => {
        job.stage = stage;
      },
    };
    return runWalkReport(opts);
  })()
    .then((report) => {
      job.status = "done";
      job.report = report;
      job.finishedAt = Date.now();
    })
    .catch((err) => {
      job.status = "error";
      job.error = err instanceof Error ? err.message : String(err);
      job.finishedAt = Date.now();
      console.error(`[walk] Job ${jobId} failed:`, err);
    });

  return c.json({ jobId, status: job.status });
});

walkRoutes.get("/report/:jobId", (c) => {
  const job = jobs.get(c.req.param("jobId"));
  if (!job) return c.json({ error: "Unknown job" }, 404);
  return c.json(job);
});

// Self-contained session replay, viewable in a normal browser tab.
walkRoutes.get("/filmstrip/:runId", (c) => {
  const runId = c.req.param("runId");
  if (!/^walk-[A-Za-z0-9-]+$/.test(runId)) {
    return c.json({ error: "Invalid run id" }, 400);
  }
  const runDir = path.join(process.cwd(), ".data", "walks", runId);
  const transcriptFile = path.join(runDir, "transcript.json");
  if (!fs.existsSync(transcriptFile)) {
    return c.json({ error: "Unknown walk" }, 404);
  }
  const walk: WalkResult = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"));
  return c.html(renderWalkHtml(walk, runDir));
});
