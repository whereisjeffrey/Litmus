import React, { useState, useEffect, useCallback } from "react";
import type { ScanState, ScanResult, ExtensionMessage, ViewportMode } from "@placeholder/shared";
import { APP_NAME, SCORE_WEIGHTS } from "@placeholder/shared";
import ScanButton from "./components/ScanButton";
import ScanProgress from "./components/ScanProgress";
import ScoreGauge from "./components/ScoreGauge";
import PlaceholderBox from "./components/PlaceholderBox";
import HookLine from "./components/HookLine";
import CategoryAccordion from "./components/CategoryAccordion";

const CATEGORY_COLORS: Record<string, string> = {
  Accessibility: "#93C5FD",
  "UX Heuristics": "#A5B4FC",
  Forms: "#BAE6FD",
  Content: "#C7D2FE",
  Visual: "#BFDBFE",
  Performance: "#DDD6FE",
};

function buildCategoryLosses(result: ScanResult) {
  return result.categories.map((cat) => {
    const maxScore = Math.round(cat.weight * 100);
    const pointsLost = Math.max(0, maxScore - Math.round(cat.score * cat.weight));
    return {
      name: cat.name,
      pointsLost,
      color: CATEGORY_COLORS[cat.name] || "#DDD6FE",
    };
  });
}

export default function App() {
  const [state, setState] = useState<ScanState>("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");

  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      switch (message.type) {
        case "SCAN_PROGRESS":
          setState("scanning");
          setProgressMessage(message.message);
          setProgressPercent(message.percent);
          break;
        case "SCAN_COMPLETE":
          setScanResult(message.result);
          setState("complete");
          break;
        case "SCAN_ERROR":
          setError(message.error);
          setState("error");
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleScan = useCallback(() => {
    setState("scanning");
    setProgressMessage("Starting scan...");
    setProgressPercent(0);
    setError(null);

    chrome.runtime.sendMessage({ type: "START_SCAN" } satisfies ExtensionMessage);
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  const handleViewportToggle = useCallback((mode: ViewportMode) => {
    setViewportMode(mode);
    chrome.runtime.sendMessage({
      type: "SET_VIEWPORT",
      mode,
    } satisfies ExtensionMessage);

    setTimeout(() => {
      setState("scanning");
      setProgressMessage("Switching viewport...");
      setProgressPercent(0);
      setError(null);
      chrome.runtime.sendMessage({ type: "START_SCAN" } satisfies ExtensionMessage);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-4 w-full box-border overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="7" cy="7" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-surface-900 tracking-tight">
            {APP_NAME}
          </span>
        </div>

        {state === "complete" && (
          <button
            onClick={handleReset}
            className="text-xs font-medium text-accent-600 hover:text-accent-700
                       px-3 py-1.5 rounded-lg hover:bg-accent-50 transition-colors"
          >
            Re-scan
          </button>
        )}
      </header>

      {/* Desktop / Mobile toggle */}
      <div className="flex gap-1 bg-surface-100 rounded-lg p-0.5 mb-4">
        <button
          onClick={() => viewportMode !== "desktop" && handleViewportToggle("desktop")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            viewportMode === "desktop"
              ? "bg-white text-accent-600 shadow-sm"
              : "text-surface-500 hover:text-surface-700"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Desktop
        </button>
        <button
          onClick={() => viewportMode !== "mobile" && handleViewportToggle("mobile")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
            viewportMode === "mobile"
              ? "bg-white text-accent-600 shadow-sm"
              : "text-surface-500 hover:text-surface-700"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="1" width="8" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Mobile
        </button>
      </div>

      {/* Idle state */}
      {state === "idle" && <ScanButton onScan={handleScan} />}

      {/* Scanning state */}
      {state === "scanning" && (
        <ScanProgress message={progressMessage} percent={progressPercent} />
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="animate-fade-in">
          <div className="rounded-xl bg-danger-50 border border-danger-100 p-4 mb-4">
            <p className="text-sm font-medium text-danger-600">
              Something went wrong
            </p>
            <p className="text-xs text-danger-500 mt-1">{error}</p>
          </div>
          <button onClick={handleReset} className="btn-primary w-full">
            Try again
          </button>
        </div>
      )}

      {/* Results state */}
      {state === "complete" && (
        <div className="animate-fade-in space-y-4">
          {/* ScoreGauge */}
          <ScoreGauge
            score={scanResult?.overallScore ?? 73}
            categoryLosses={scanResult ? buildCategoryLosses(scanResult) : [
              { name: "Accessibility", pointsLost: 12, color: "#93C5FD" },
              { name: "UX Heuristics", pointsLost: 8, color: "#A5B4FC" },
              { name: "Forms", pointsLost: 3, color: "#BAE6FD" },
              { name: "Content", pointsLost: 2, color: "#C7D2FE" },
              { name: "Visual", pointsLost: 1, color: "#BFDBFE" },
              { name: "Performance", pointsLost: 1, color: "#DDD6FE" },
            ]}
            pageType={scanResult?.pageType ?? "Web Page"}
            animated={true}
          />

          {/* AI Hook Line & Quick Wins */}
          {scanResult?.aiAnalysis ? (
            <HookLine
              hookLine={scanResult.aiAnalysis.hookLine}
              quickWins={scanResult.aiAnalysis.quickWins}
            />
          ) : (
            <PlaceholderBox label="Hook Line" height={60} />
          )}

          {/* Category accordion */}
          {scanResult && <CategoryAccordion result={scanResult} />}

          {/* Placeholder: Pro Upsell */}
          <PlaceholderBox label="Pro Upsell" height={120} />

          {/* Footer */}
          <div className="text-center pt-3 pb-4 border-t border-surface-200">
            <p className="text-2xs text-surface-500">
              Scanned {scanResult?.crawl?.totalElements ?? "\u2014"} elements
            </p>
            <p className="text-2xs text-surface-400 mt-0.5">
              {scanResult?.url ? new URL(scanResult.url).hostname : "\u2014"} &middot;{" "}
              {scanResult?.timestamp ? new Date(scanResult.timestamp).toLocaleTimeString() : "\u2014"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
