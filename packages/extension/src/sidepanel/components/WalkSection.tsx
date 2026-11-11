import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  apiClient,
  walkFilmstripUrl,
  type WalkJob,
  type WalkFinding,
} from "../lib/api-client";

/**
 * Usability walk — the drawer surface for the persona-walk pipeline.
 * Design rule: evidence on display, machinery in background. Personas appear
 * as testers with names and quotes; synthesis/adversary stay behind the
 * curtain except as trust cues ("findings are verified before you see them").
 */

interface WalkSectionProps {
  url: string;
  pageType?: string;
  industry?: string;
}

const POLL_MS = 5000;

const IMPACT_STYLE: Record<WalkFinding["impact"], string> = {
  critical: "bg-danger-50 text-danger-600 border-danger-100",
  high: "bg-danger-50 text-danger-500 border-danger-100",
  medium: "bg-amber-50 text-amber-600 border-amber-100",
  low: "bg-surface-100 text-surface-500 border-surface-200",
};

function convergenceLabel(convergence: string): string | null {
  if (convergence === "all-personas" || convergence === "multiple") {
    return "Every tester hit this";
  }
  if (convergence === "single") return "One tester hit this";
  if (convergence === "expert-only") return "Consultant's observation";
  return null;
}

function stageCopy(job: WalkJob): { title: string; sub: string } {
  const names = job.personaNames.join(" and ");
  switch (job.stage) {
    case "planning":
      return {
        title: "Working out what your customers come here to do...",
        sub: "We test the task your business actually depends on.",
      };
    case "walking":
      return {
        title: `${names} are on your site right now`,
        sub: job.task
          ? `Their task: ${job.task.split(". ")[0]}.`
          : "They're trying to complete your key task, step by step.",
      };
    case "synthesizing":
      return {
        title: "Reviewing what happened in their sessions...",
        sub: "A UX consultant is reading every step and screenshot.",
      };
    case "reviewing":
      return {
        title: "Verifying findings before you see them...",
        sub: "Anything that doesn't survive scrutiny gets thrown out, not shown.",
      };
  }
}

function elapsedLabel(startedAt: number, now: number): string {
  const s = Math.max(0, Math.round((now - startedAt) / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export default function WalkSection({ url, pageType, industry }: WalkSectionProps) {
  const [job, setJob] = useState<WalkJob | null>(null);
  const [starting, setStarting] = useState(false);
  const [failedToStart, setFailedToStart] = useState(false);
  const [now, setNow] = useState(Date.now());
  const jobIdRef = useRef<string | null>(null);

  const running = job?.status === "running" || starting;

  const handleStart = useCallback(async () => {
    setStarting(true);
    setFailedToStart(false);
    const started = await apiClient.startWalk(url, pageType, industry);
    if (!started) {
      setStarting(false);
      setFailedToStart(true);
      return;
    }
    jobIdRef.current = started.jobId;
    const first = await apiClient.getWalkJob(started.jobId);
    if (first) setJob(first);
    setStarting(false);
  }, [url, pageType, industry]);

  // Poll while running
  useEffect(() => {
    if (!job || job.status !== "running") return;
    const interval = setInterval(async () => {
      const id = jobIdRef.current;
      if (!id) return;
      const next = await apiClient.getWalkJob(id);
      if (next) setJob(next);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [job]);

  // Elapsed-time ticker
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [running]);

  // ── Idle: the pitch ──
  if (!job && !starting) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-600">
              <circle cx="5.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2 13c0-2 1.5-3.5 3.5-3.5S9 11 9 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M10 6.5l1.5 1.5L14.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900">
              See real customers try your site
            </p>
            <p className="text-xs text-surface-500 mt-1 leading-relaxed">
              Simulated customers attempt the thing your site exists for — getting a
              quote, checking out, signing up — and narrate every point of friction.
              Findings are verified before they reach you.
            </p>
            {failedToStart && (
              <p className="text-2xs text-danger-500 mt-2">
                Couldn't reach the analysis server. Is it running?
              </p>
            )}
            <button onClick={handleStart} className="btn-primary w-full mt-3">
              Run usability test · 3–6 min
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Running: live narration ──
  if (running || (job && job.status === "running")) {
    const copy = job
      ? stageCopy(job)
      : { title: "Setting up the test...", sub: "" };
    return (
      <div className="rounded-xl border border-accent-100 p-4" style={{ backgroundColor: "#ECF8FF" }}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500" />
          </span>
          <p className="text-xs font-semibold text-accent-700">{copy.title}</p>
        </div>
        {copy.sub && (
          <p className="text-2xs text-accent-500 mt-1.5 leading-relaxed pl-[18px]">{copy.sub}</p>
        )}
        <p className="text-2xs text-accent-400 mt-2 pl-[18px]">
          {job ? elapsedLabel(job.startedAt, now) : ""} · usually 3–6 minutes — leave
          this panel open
        </p>
      </div>
    );
  }

  // ── Error ──
  if (job && job.status === "error") {
    return (
      <div className="rounded-xl bg-danger-50 border border-danger-100 p-4">
        <p className="text-sm font-medium text-danger-600">Usability test failed</p>
        <p className="text-xs text-danger-500 mt-1 break-words">{job.error}</p>
        <button onClick={handleStart} className="btn-primary w-full mt-3">
          Try again
        </button>
      </div>
    );
  }

  // ── Done: the report ──
  const report = job?.report;
  if (!job || !report) return null;

  const confirmed = report.adversary.confirmed;
  const withheldCount =
    report.adversary.killed.length + report.adversary.needsEvidence.length;
  const reviewedCount = confirmed.length + withheldCount;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-accent-600">
          <circle cx="6.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2.5 15c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M11.5 7.5l1.7 1.7 3.3-3.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-base font-bold text-surface-900">
          We Tried Using Your Site
        </h2>
      </div>

      {/* What we tested */}
      {job.task && (
        <p className="text-2xs text-surface-500 leading-relaxed">
          <span className="font-semibold text-surface-600">The task:</span>{" "}
          {job.task}
        </p>
      )}

      {/* Consultant's summary */}
      {report.synthesis.summary && (
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-3.5">
          <p className="text-xs text-surface-600 leading-relaxed italic">
            {report.synthesis.summary}
          </p>
        </div>
      )}

      {/* Confirmed findings */}
      {confirmed.length === 0 ? (
        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <p className="text-sm font-semibold text-surface-900">
            Nothing got in their way
          </p>
          <p className="text-xs text-surface-500 mt-1 leading-relaxed">
            Our testers completed the task without hitting verified friction. That
            is a real result — most sites fail this.
          </p>
        </div>
      ) : (
        confirmed.map((finding, index) => {
          const cLabel = convergenceLabel(finding.convergence);
          return (
            <div key={index} className="rounded-xl border border-surface-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${IMPACT_STYLE[finding.impact]}`}
                    >
                      {finding.impact}
                    </span>
                    {cLabel && (
                      <span className="text-2xs text-surface-400">{cLabel}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-surface-900 leading-snug mt-1.5">
                    {finding.headline}
                  </p>
                  <p className="text-xs text-surface-500 leading-relaxed mt-1.5">
                    {finding.narrative}
                  </p>

                  {/* Tester quotes — the evidence on display */}
                  {finding.evidence.slice(0, 2).map((ev, i) => (
                    <div key={i} className="mt-2 border-l-2 border-accent-200 pl-2.5">
                      <p className="text-2xs text-surface-500 italic leading-relaxed">
                        &ldquo;{ev.quote}&rdquo;
                      </p>
                      <p className="text-2xs text-surface-400 mt-0.5">
                        — {ev.personaLabel}, step {ev.step}
                      </p>
                    </div>
                  ))}

                  {/* Recommendation */}
                  {finding.recommendation && (
                    <p className="text-xs text-surface-600 leading-relaxed mt-2.5">
                      <span className="font-semibold">Fix:</span>{" "}
                      {finding.recommendation}
                    </p>
                  )}

                  {/* Research citation */}
                  {finding.research && (
                    <p className="text-2xs text-surface-400 mt-1.5">
                      {finding.research}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* What held up well */}
      {report.synthesis.strengths.length > 0 && (
        <div className="rounded-xl border border-surface-200 bg-white p-3.5">
          <p className="text-2xs font-semibold text-surface-600 uppercase tracking-wide">
            What held up well
          </p>
          <div className="mt-1.5 space-y-1">
            {report.synthesis.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-1 h-1 rounded-full bg-accent-400 mt-1.5" />
                <span className="text-2xs text-surface-500">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust cue + session replays */}
      <div className="text-center pt-1 pb-2">
        {reviewedCount > 0 && (
          <p className="text-2xs text-surface-400">
            {reviewedCount} observation{reviewedCount !== 1 ? "s" : ""} reviewed ·{" "}
            {withheldCount} didn&apos;t survive verification and{" "}
            {withheldCount === 1 ? "was" : "were"} withheld
          </p>
        )}
        <div className="flex items-center justify-center gap-3 mt-1.5">
          {report.walkRunIds.map((runId, i) => (
            <a
              key={runId}
              href={walkFilmstripUrl(runId)}
              target="_blank"
              rel="noreferrer"
              className="text-2xs font-medium text-accent-600 hover:text-accent-700"
            >
              Watch {job.personaNames[i] ?? `session ${i + 1}`}&apos;s session ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
