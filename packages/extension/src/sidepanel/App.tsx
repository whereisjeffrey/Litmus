import React, { useState, useEffect, useCallback } from "react";
import type { ScanState, ExtensionMessage } from "@placeholder/shared";
import { APP_NAME } from "@placeholder/shared";
import ScanButton from "./components/ScanButton";
import ScanProgress from "./components/ScanProgress";
import ScoreGauge from "./components/ScoreGauge";
import PlaceholderBox from "./components/PlaceholderBox";

// Mock data for the score gauge
const MOCK_CATEGORY_LOSSES = [
  { name: "Accessibility", pointsLost: 12, color: "#7BA3C4" },
  { name: "UX Heuristics", pointsLost: 8, color: "#9B82B8" },
  { name: "Forms", pointsLost: 3, color: "#6BA8A0" },
  { name: "Content", pointsLost: 2, color: "#C4A04E" },
  { name: "Visual", pointsLost: 1, color: "#C48A9A" },
  { name: "Performance", pointsLost: 1, color: "#8893A6" },
];

export default function App() {
  const [state, setState] = useState<ScanState>("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      switch (message.type) {
        case "SCAN_PROGRESS":
          setProgressMessage(message.message);
          setProgressPercent(message.percent);
          break;
        case "SCAN_COMPLETE":
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

  // For demo: skip straight to results
  const handleDemoResults = useCallback(() => {
    setState("complete");
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 px-4 py-4" style={{ width: 380 }}>
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Simple logo mark */}
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
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
            className="text-xs font-medium text-surface-500 hover:text-surface-700
                       px-3 py-1.5 rounded-lg hover:bg-surface-100 transition-colors"
          >
            Re-scan
          </button>
        )}
      </header>

      {/* Idle state */}
      {state === "idle" && <ScanButton onScan={handleScan} />}

      {/* Scanning state */}
      {state === "scanning" && (
        <ScanProgress message={progressMessage} percent={progressPercent} />
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="animate-fade-in">
          <div className="card border-danger-400 bg-danger-50 mb-4">
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
        <div className="animate-fade-in space-y-3">
          {/* Real ScoreGauge */}
          <ScoreGauge
            score={73}
            categoryLosses={MOCK_CATEGORY_LOSSES}
            pageType="landing"
            animated={true}
          />

          {/* Placeholder: Hook Line */}
          <PlaceholderBox label="Hook Line" height={60} />

          {/* Placeholder: Category Bars */}
          <PlaceholderBox label="Category Bars" height={180} />

          {/* Placeholder: Severity Stats */}
          <div className="grid grid-cols-3 gap-2">
            <PlaceholderBox label="Critical" height={70} />
            <PlaceholderBox label="Warning" height={70} />
            <PlaceholderBox label="Info" height={70} />
          </div>

          {/* Placeholder: Filter Tabs */}
          <PlaceholderBox label="Filter Tabs" height={40} />

          {/* Placeholder: Finding Cards */}
          <PlaceholderBox label="Finding Card 1" height={100} />
          <PlaceholderBox label="Finding Card 2" height={100} />
          <PlaceholderBox label="Finding Card 3" height={100} />

          {/* Placeholder: Pro Upsell */}
          <PlaceholderBox label="Pro Upsell" height={120} />

          {/* Footer */}
          <div className="text-center pt-2 pb-3 border-t border-surface-200">
            <p className="text-2xs text-surface-500">
              Scanned 847 elements
            </p>
            <p className="text-2xs text-surface-400">
              yoursite.com &middot; 2:34 PM
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
