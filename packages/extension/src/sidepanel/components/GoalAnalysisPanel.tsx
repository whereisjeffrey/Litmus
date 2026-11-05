import React, { useState, useEffect, useCallback } from "react";
import type {
  ScanResult,
  ExtensionMessage,
  GoalId,
  GoalMarker,
  GoalAnalysisResult,
  GoalFrictionPoint,
  JourneyStep,
  SiteUnderstanding,
} from "@placeholder/shared";
import { PageType, suggestGoalsForPage, getGoal } from "@placeholder/shared";
import { apiClient } from "../lib/api-client";
import { runJourney } from "../lib/journey";
import { captureElementThumbnail } from "../lib/thumbnail";
import {
  resultKey,
  getCachedResult,
  setCachedResult,
  getCachedUnderstanding,
  setCachedUnderstanding,
} from "../lib/page-cache";

async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

type GoalState = "idle" | "running" | "complete" | "error";

interface Props {
  pageType: PageType;
  scanResult: ScanResult | null;
}

const SEVERITY_STYLE: Record<string, { dot: string; label: string }> = {
  blocker: { dot: "bg-danger-500", label: "Blocker" },
  major: { dot: "bg-amber-500", label: "Major" },
  minor: { dot: "bg-surface-400", label: "Minor" },
};

function scoreColor(score: number): string {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return "#CA8A04";
  return "#DC2626";
}

function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.pathname === "/" ? u.hostname : u.pathname).replace(/\/$/, "") || u.hostname;
  } catch {
    return url;
  }
}

export default function GoalAnalysisPanel({ pageType, scanResult }: Props) {
  const [goalState, setGoalState] = useState<GoalState>("idle");
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null);
  const [customGoal, setCustomGoal] = useState("");
  const [scope, setScope] = useState<"page" | "journey">("page");
  const [result, setResult] = useState<GoalAnalysisResult | null>(null);
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  const [endedReason, setEndedReason] = useState("");
  const [understanding, setUnderstanding] = useState<SiteUnderstanding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState("");

  const goals = suggestGoalsForPage(pageType);

  const runAnalysis = useCallback(
    async (goalId: GoalId) => {
      if (goalId === "custom" && !customGoal.trim()) return;
      setSelectedGoal(goalId);
      setError(null);
      setResult(null);
      setJourneySteps([]);
      setGoalState("running");
      setStatusLine(scope === "journey" ? "Starting the walk-through…" : "Measuring the page…");

      // Reuse an identical recent analysis (same goal + scope + URL) — instant,
      // no journey walk, no Claude spend.
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = activeTabs[0]?.url || "";
      const cacheKey = resultKey(goalId, customGoal.trim(), scope, currentUrl);
      const cached = getCachedResult(cacheKey);
      if (cached) {
        setResult(cached.result);
        setJourneySteps(cached.journeySteps);
        setEndedReason(cached.endedReason);
        setUnderstanding(cached.understanding ?? null);
        setGoalState("complete");
        return;
      }

      // Walk the funnel (1 step for "this page", up to 5 for "whole journey"),
      // capturing full-page screenshots at each step.
      const outcome = await runJourney({
        goalId,
        customGoal: customGoal.trim() || undefined,
        maxSteps: scope === "journey" ? 5 : 1,
        fullPage: true,
        onProgress: (m) => setStatusLine(m),
      });

      if (!outcome.steps.length) {
        setError(outcome.endedReason || "Couldn't read the page — try reloading it.");
        setGoalState("error");
        return;
      }

      // Build (or reuse) a deep understanding of the site first, then feed it
      // into the goal critique as ground-truth context.
      const entry = outcome.steps[0];
      let siteUnderstanding = getCachedUnderstanding(entry.url);
      if (!siteUnderstanding) {
        setStatusLine("Understanding what this site is…");
        const su = await apiClient.understandSite({
          url: entry.url,
          title: scanResult?.crawl?.title,
          pageType: String(entry.pageType),
          signals: outcome.entrySignals,
          screenshots: entry.screenshots?.length ? entry.screenshots : entry.screenshot ? [entry.screenshot] : [],
        });
        if (su) {
          siteUnderstanding = su;
          setCachedUnderstanding(entry.url, su);
        }
      }
      setUnderstanding(siteUnderstanding ?? null);

      setStatusLine("Analyzing the experience…");
      const res = await apiClient.analyzeGoal({
        goalId,
        customGoal: customGoal.trim() || undefined,
        url: outcome.steps[0].url,
        siteUnderstanding: siteUnderstanding ?? undefined,
        signals: outcome.entrySignals,
        anchors: outcome.lastAnchors,
        journey: outcome.steps,
        scanData: scanResult
          ? {
              overallScore: scanResult.overallScore,
              pageType: String(scanResult.pageType),
              categories: scanResult.categories,
              allFindings: scanResult.allFindings.map((f) => ({
                scanner: f.scanner,
                severity: f.severity,
                title: f.title,
                description: f.description,
              })),
            }
          : undefined,
      });

      if (!res) {
        setError("Analysis failed. Is the API server running with a valid Anthropic key?");
        setGoalState("error");
        return;
      }
      setResult(res);
      setJourneySteps(outcome.steps);
      setEndedReason(outcome.endedReason);
      setGoalState("complete");
      setCachedResult(cacheKey, {
        result: res,
        journeySteps: outcome.steps,
        endedReason: outcome.endedReason,
        understanding: siteUnderstanding ?? undefined,
      });
    },
    [customGoal, scope, scanResult]
  );

  const showMe = useCallback((f: GoalFrictionPoint) => {
    if (!f.selector) return;
    chrome.runtime.sendMessage({
      type: "SHOW_ELEMENT",
      selector: f.selector,
      title: f.title,
      description: f.diagnosis,
    } satisfies ExtensionMessage);
  }, []);

  const getThumbnail = useCallback(async (selector: string): Promise<string | null> => {
    const tabId = await getActiveTabId();
    if (tabId == null) return null;
    return captureElementThumbnail(tabId, selector);
  }, []);

  // Place hover-info marker pins on the page for every located friction point,
  // and clear them when the result changes or the panel unmounts.
  useEffect(() => {
    if (goalState !== "complete" || !result) return;
    let cancelled = false;
    (async () => {
      const tabId = await getActiveTabId();
      if (tabId == null || cancelled) return;
      const markers: GoalMarker[] = result.frictionPoints
        .filter((f) => f.selector)
        .map((f) => ({
          id: f.id,
          selector: f.selector as string,
          title: f.title,
          summary: f.fixes[0] || f.diagnosis || `Could lift ${f.estimatedUpside}`,
          severity: f.severity,
        }));
      chrome.tabs.sendMessage(tabId, { type: "SHOW_GOAL_MARKERS", markers } satisfies ExtensionMessage).catch(() => {});
    })();
    return () => {
      cancelled = true;
      getActiveTabId().then((id) => {
        if (id != null) chrome.tabs.sendMessage(id, { type: "CLEAR_GOAL_MARKERS" } satisfies ExtensionMessage).catch(() => {});
      });
    };
  }, [goalState, result]);

  const reset = useCallback(() => {
    setGoalState("idle");
    setResult(null);
    setJourneySteps([]);
    setUnderstanding(null);
    setSelectedGoal(null);
    setError(null);
  }, []);

  // ─── Picker ───────────────────────────────────────────────────────
  if (goalState === "idle" || goalState === "error") {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-surface-900">What's the goal?</h2>
          <p className="text-sm text-surface-500 mt-0.5">
            We'll judge how well a real human reaches that outcome — psychology, not just checklists.
          </p>
        </div>

        {/* Scope: analyze this page, or walk the whole funnel */}
        <div>
          <div className="flex gap-1 bg-surface-100 rounded-lg p-0.5">
            <button
              onClick={() => setScope("page")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                scope === "page" ? "bg-white text-accent-600 shadow-sm" : "text-surface-500 hover:text-surface-700"
              }`}
            >
              This page
            </button>
            <button
              onClick={() => setScope("journey")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                scope === "journey" ? "bg-white text-accent-600 shadow-sm" : "text-surface-500 hover:text-surface-700"
              }`}
            >
              Whole journey
            </button>
          </div>
          {scope === "journey" && (
            <p className="text-sm text-surface-400 mt-1.5 leading-snug">
              We'll click through the funnel toward the goal (up to 5 steps) and score the whole flow. We never buy, submit, or log out.
            </p>
          )}
        </div>

        <div className="space-y-2">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => runAnalysis(g.id)}
              className="w-full text-left rounded-xl border border-surface-200 hover:border-accent-300
                         hover:bg-accent-50 p-3 transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5">{g.icon}</span>
                <div>
                  <p className="text-base font-semibold text-surface-900 group-hover:text-accent-700">
                    {g.label}
                  </p>
                  <p className="text-sm text-surface-500 mt-0.5 leading-snug">{g.tagline}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-1">
          <p className="text-sm font-medium text-surface-500 mb-1.5">Or describe your own goal</p>
          <div className="flex gap-2">
            <input
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAnalysis("custom")}
              placeholder="e.g. get users to book a demo"
              className="flex-1 text-base rounded-lg border border-surface-200 px-2.5 py-2
                         focus:outline-none focus:border-accent-400"
            />
            <button
              onClick={() => runAnalysis("custom")}
              disabled={!customGoal.trim()}
              className="text-base font-medium px-3 py-2 rounded-lg bg-accent-600 text-white
                         disabled:opacity-40 hover:bg-accent-700 transition-colors"
            >
              Go
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-100 p-2.5">
            <p className="text-sm text-danger-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Running ──────────────────────────────────────────────────────
  if (goalState === "running") {
    const g = selectedGoal && selectedGoal !== "custom" ? getGoal(selectedGoal) : null;
    return (
      <div className="rounded-xl border border-accent-100 p-6 text-center" style={{ backgroundColor: "#ECF8FF" }}>
        <div className="text-2xl mb-2 animate-pulse">{g?.icon ?? "🎯"}</div>
        <p className="text-base font-medium text-accent-700">
          Evaluating: {g?.label ?? customGoal}
        </p>
        <p className="text-sm text-accent-500 mt-1 animate-pulse">{statusLine}</p>
        <p className="text-sm text-accent-400 mt-2">
          {scope === "journey" ? "Walking the funnel — this can take up to a minute" : "This takes 10-15 seconds"}
        </p>
      </div>
    );
  }

  // ─── Results ──────────────────────────────────────────────────────
  if (goalState === "complete" && result) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900 truncate pr-2">{result.goalLabel}</h2>
          <button onClick={reset} className="text-sm font-medium text-accent-600 hover:text-accent-700 shrink-0">
            New goal
          </button>
        </div>

        {/* Score + verdict */}
        <div className="rounded-xl border border-surface-200 p-4 text-center">
          <div className="text-4xl font-bold" style={{ color: scoreColor(result.goalScore) }}>
            {result.goalScore}
            <span className="text-base text-surface-400 font-medium">/100</span>
          </div>
          <p className="text-sm text-surface-500 mt-0.5">Goal achievement score</p>
          {result.verdict && (
            <p className="text-base text-surface-700 mt-2 leading-snug">{result.verdict}</p>
          )}
        </div>

        {/* About this site — the comprehension pass that grounded the analysis */}
        {understanding && <SiteUnderstandingCard su={understanding} />}

        {/* Journey path (multi-step walk-through) */}
        {journeySteps.length > 1 && (
          <div className="rounded-xl border border-surface-200 p-3">
            <p className="text-sm font-medium text-surface-500 uppercase tracking-wide mb-2">
              The path we walked ({journeySteps.length} steps)
            </p>
            <ol className="space-y-1.5">
              {journeySteps.map((s) => (
                <li key={s.index} className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-accent-100 text-accent-700 text-[10px] font-semibold mt-0.5 shrink-0">
                    {s.index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-surface-700 truncate">{prettyUrl(s.url)}</p>
                    {s.actionTaken && (
                      <p className="text-sm text-surface-400">↳ {s.actionTaken}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {endedReason && <p className="text-sm text-surface-400 mt-2 italic">{endedReason}</p>}
          </div>
        )}

        {/* Projected upside teaser */}
        {result.projectedUpside && (
          <div className="rounded-xl bg-accent-50 border border-accent-100 p-3">
            <p className="text-sm font-medium text-accent-500 uppercase tracking-wide">Projected upside</p>
            <p className="text-base font-semibold text-accent-700 mt-0.5">{result.projectedUpside}</p>
            <p className="text-sm text-accent-500 mt-0.5">if the top fixes below are applied</p>
          </div>
        )}

        {/* Primary blocker */}
        {result.primaryBlocker && (
          <div className="rounded-xl bg-danger-50 border border-danger-100 p-3">
            <p className="text-sm font-medium text-danger-500 uppercase tracking-wide">Biggest blocker</p>
            <p className="text-base text-danger-700 mt-0.5 leading-snug">{result.primaryBlocker}</p>
          </div>
        )}

        {/* Rubric bars */}
        {result.rubricScores.length > 0 && (
          <div className="space-y-1.5">
            {result.rubricScores.map((r) => {
              const dim = selectedGoal && selectedGoal !== "custom"
                ? getGoal(selectedGoal)?.rubric.find((d) => d.key === r.dimension)
                : undefined;
              return (
                <div key={r.dimension}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-surface-600">{dim?.label ?? r.dimension}</span>
                    <span className="font-medium text-surface-700">{r.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Friction points */}
        <div className="space-y-2.5">
          <p className="text-sm font-semibold text-surface-500 uppercase tracking-wide">
            What's in the way ({result.frictionPoints.length})
          </p>
          {result.frictionPoints.map((f) => (
            <FrictionCard
              key={f.id}
              f={f}
              onShowMe={() => showMe(f)}
              getThumbnail={getThumbnail}
              stepLabel={journeySteps.length > 1 ? `Step ${(f.journeyStep ?? 0) + 1}` : null}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── "About this site" — the comprehension that grounded the analysis ─

function SiteUnderstandingCard({ su }: { su: SiteUnderstanding }) {
  const [open, setOpen] = useState(false);
  const offers = su.siteIdentity?.whatItOffers;
  const persona = su.audience?.primaryPersona;
  const conversion = su.primaryPurpose?.primaryConversion;
  const questions = [
    ...(su.audienceQuestions?.whoIsUsingIt ?? []),
    ...(su.audienceQuestions?.whatTheyWant ?? []),
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-3 flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">🧭</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-700">What we understand about this site</p>
          {offers && <p className="text-sm text-surface-500 mt-0.5 leading-snug line-clamp-2">{offers}</p>}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`mt-1 shrink-0 text-surface-400 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in">
          {conversion && <Fact label="What it wants users to do" value={conversion} />}
          {persona && <Fact label="Primary user" value={persona} />}
          {su.pageRole?.jobOfThisPage && <Fact label="This page's job" value={su.pageRole.jobOfThisPage} />}
          {su.userJobs?.length ? <Fact label="Users are trying to" value={su.userJobs.slice(0, 3).join("; ")} /> : null}
          {su.userProblems?.length ? (
            <Fact label="Their worries" value={su.userProblems.slice(0, 3).map((p) => p.problem).join("; ")} />
          ) : null}

          {questions.length > 0 && (
            <div className="pt-1">
              <p className="text-sm font-semibold text-surface-600">To sharpen this, tell us:</p>
              <ul className="mt-1 space-y-1">
                {questions.slice(0, 5).map((q, i) => (
                  <li key={i} className="text-sm text-surface-500 flex gap-1.5 leading-snug">
                    <span className="text-accent-400">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-surface-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-surface-700 leading-snug">{value}</p>
    </div>
  );
}

// ─── Friction card — accordion with element thumbnail ────────────────

function FrictionCard({
  f,
  onShowMe,
  getThumbnail,
  stepLabel,
}: {
  f: GoalFrictionPoint;
  onShowMe: () => void;
  getThumbnail: (selector: string) => Promise<string | null>;
  stepLabel?: string | null;
}) {
  const sev = SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.minor;
  const [open, setOpen] = useState(false);
  // undefined = not yet loaded, null = unavailable, string = loaded
  const [thumb, setThumb] = useState<string | null | undefined>(undefined);
  const [thumbLoading, setThumbLoading] = useState(false);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next && f.selector && thumb === undefined && !thumbLoading) {
      setThumbLoading(true);
      getThumbnail(f.selector)
        .then((t) => setThumb(t))
        .finally(() => setThumbLoading(false));
    }
  }, [open, f.selector, thumb, thumbLoading, getThumbnail]);

  return (
    <div className="rounded-xl border border-surface-200 overflow-hidden">
      {/* Header (always visible): title + % upside */}
      <button
        onClick={toggle}
        className="w-full text-left p-3 flex items-start gap-2 hover:bg-surface-50 transition-colors"
      >
        <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          {stepLabel && (
            <span className="inline-block text-[11px] font-medium text-surface-500 bg-surface-100 rounded px-1.5 py-0.5 mb-1">
              {stepLabel}
            </span>
          )}
          <p className="text-base font-semibold text-surface-900 leading-snug">{f.title}</p>
          {f.estimatedUpside && (
            <span className="inline-block mt-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              ↑ {f.estimatedUpside}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`mt-1 shrink-0 text-surface-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Body (expanded) */}
      {open && (
        <div className="px-3 pb-3 pt-0 animate-fade-in">
          {f.lens && (
            <p className="text-sm text-surface-500 leading-snug mb-2">
              {f.lens}
              {f.principleName && (
                <span
                  className="ml-1 text-surface-400 cursor-help border-b border-dotted border-surface-300"
                  title={f.principleName}
                >
                  ⓘ
                </span>
              )}
            </p>
          )}

          {/* Element thumbnail — "here's where this is" */}
          {f.selector && (
            <div className="mb-2">
              {thumbLoading ? (
                <div className="h-20 rounded-lg bg-surface-100 animate-pulse flex items-center justify-center">
                  <span className="text-sm text-surface-400">Finding it on the page…</span>
                </div>
              ) : thumb ? (
                <img
                  src={thumb}
                  alt="Where this issue is on the page"
                  className="w-full rounded-lg border border-surface-200 max-h-48 object-contain bg-surface-50"
                />
              ) : null}
            </div>
          )}

          {f.locked ? (
            <LockedTease upside={f.estimatedUpside} />
          ) : (
            <>
              {f.diagnosis && (
                <p className="text-sm text-surface-700 leading-snug">{f.diagnosis}</p>
              )}
              {f.fixes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {f.fixes.map((fix, i) => (
                    <li key={i} className="text-sm text-surface-600 flex gap-1.5">
                      <span className="text-accent-400">→</span>
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              )}
              {f.selector && (
                <button
                  onClick={onShowMe}
                  className="mt-2.5 text-sm font-medium text-accent-600 hover:text-accent-700"
                >
                  Show me on the page →
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LockedTease({ upside }: { upside: string }) {
  return (
    <div className="relative mt-1.5">
      {/* Blurred placeholder content */}
      <div className="select-none blur-[5px] pointer-events-none" aria-hidden>
        <p className="text-sm text-surface-600 leading-snug">
          The specific cause and the exact fix for this friction point are part of the full consultant report.
        </p>
        <ul className="mt-1.5 space-y-0.5">
          <li className="text-sm text-surface-500">→ Detailed fix recommendation one</li>
          <li className="text-sm text-surface-500">→ Detailed fix recommendation two</li>
        </ul>
      </div>
      {/* Overlay with quantified upside */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-accent-700
                           bg-white/90 border border-accent-200 rounded-full px-3 py-1.5 shadow-sm
                           hover:bg-white transition-colors">
          <span>🔒</span>
          <span>Unlock — could lift {upside}</span>
        </button>
      </div>
    </div>
  );
}
