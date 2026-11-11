import type { ScanResult, AIAnalysis } from "@placeholder/shared";

const API_BASE = "http://localhost:3001"; // Will be configurable later

// ─── Walk (usability test) types — mirror packages/api walk pipeline ───

export interface WalkEvidence {
  walkRunId: string;
  step: number;
  personaLabel: string;
  quote: string;
}

export interface WalkFinding {
  headline: string;
  narrative: string;
  category: string;
  impact: "critical" | "high" | "medium" | "low";
  convergence: string;
  evidence: WalkEvidence[];
  recommendation: string;
  research: string | null;
  verdict: "CONFIRMED" | "KILLED" | "NEEDS_EVIDENCE";
  steelman: string;
  verdictReasoning: string;
}

export interface WalkJobReport {
  url: string;
  task: string;
  walkRunIds: string[];
  synthesis: { summary: string; strengths: string[] };
  adversary: {
    confirmed: WalkFinding[];
    killed: WalkFinding[];
    needsEvidence: WalkFinding[];
  };
}

export interface WalkJob {
  jobId: string;
  status: "running" | "done" | "error";
  stage: "planning" | "walking" | "synthesizing" | "reviewing";
  task?: string;
  personaNames: string[];
  startedAt: number;
  finishedAt?: number;
  report?: WalkJobReport;
  error?: string;
}

export function walkFilmstripUrl(runId: string): string {
  return `${API_BASE}/api/walk/filmstrip/${runId}`;
}

const INTERACTIVE_TAGS = new Set([
  "A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY", "LABEL",
  "H1", "H2", "H3", // structural anchors so the model can reference sections
]);

/**
 * Compact inventory of interactive + structural elements, derived from the
 * crawl data we already collect. Gives the AI concrete elements with positions
 * to reason about (and reference in evidence) alongside the screenshots.
 */
function buildDomDigest(scanResult: ScanResult) {
  const viewportHeight = 800; // fold approximation, matches scanner convention
  return scanResult.crawl.elements
    .filter(
      (e) =>
        e.isVisible &&
        (INTERACTIVE_TAGS.has(e.tagName.toUpperCase()) ||
          e.attributes["role"] === "button" ||
          e.attributes["role"] === "link")
    )
    .slice(0, 150)
    .map((e) => ({
      tag: e.tagName.toLowerCase(),
      text: (e.textContent || e.attributes["aria-label"] || e.attributes["placeholder"] || "").trim().slice(0, 80),
      selector: e.selector,
      x: Math.round(e.boundingRect.x),
      y: Math.round(e.boundingRect.y),
      w: Math.round(e.boundingRect.width),
      h: Math.round(e.boundingRect.height),
      aboveFold: e.boundingRect.y < viewportHeight,
    }));
}

export const apiClient = {
  async saveScan(
    scanResult: ScanResult,
    accessToken?: string
  ): Promise<{ id: string } | null> {
    // If no access token, user isn't logged in — silently skip
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_BASE}/api/scan/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          url: scanResult.url,
          pageType: scanResult.pageType,
          overallScore: scanResult.overallScore,
          viewportMode: "desktop", // TODO: get from state
          categoryScores: scanResult.categories,
          aiAnalysis: scanResult.aiAnalysis,
          findings: scanResult.allFindings,
        }),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      // API not available — silently fail (extension works offline)
      return null;
    }
  },

  async getHistory(accessToken: string, limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE}/api/scan/history?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  async getScan(scanId: string, accessToken: string) {
    try {
      const response = await fetch(`${API_BASE}/api/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  async captureScreenshot(): Promise<string | null> {
    try {
      console.log("[AI] Requesting screenshot from service worker...");
      const response = await chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" });
      console.log("[AI] Screenshot response:", response?.dataUrl ? `got ${response.dataUrl.length} chars` : "null/empty");
      return response?.dataUrl || null;
    } catch (err) {
      console.error("[AI] Screenshot capture error:", err);
      return null;
    }
  },

  async analyzeWithAI(
    scanResult: ScanResult,
    captures?: { desktop: string[]; mobile: string[] } | null
  ): Promise<AIAnalysis | null> {
    try {
      const response = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanData: {
            overallScore: scanResult.overallScore,
            pageType: scanResult.pageType,
            categories: scanResult.categories,
            allFindings: scanResult.allFindings.map((f) => ({
              scanner: f.scanner,
              severity: f.severity,
              title: f.title,
              description: f.description,
            })),
          },
          pageType: scanResult.pageType,
          url: scanResult.url,
          pageTitle: scanResult.crawl.title,
          screenshots: captures && captures.desktop.length > 0 ? captures.desktop : undefined,
          mobileScreenshots: captures && captures.mobile.length > 0 ? captures.mobile : undefined,
          domDigest: buildDomDigest(scanResult),
        }),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  /** Start a usability-walk pipeline. Task is inferred server-side. */
  async startWalk(
    url: string,
    pageType?: string,
    industry?: string
  ): Promise<{ jobId: string } | null> {
    try {
      const response = await fetch(`${API_BASE}/api/walk/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, pageType, industry }),
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  async getWalkJob(jobId: string): Promise<WalkJob | null> {
    try {
      const response = await fetch(`${API_BASE}/api/walk/report/${jobId}`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },
};
