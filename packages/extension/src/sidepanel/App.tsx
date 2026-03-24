import React, { useState, useEffect, useCallback } from "react";
import type { ScanResult, ScanState, ExtensionMessage } from "@placeholder/shared";
import { APP_NAME } from "@placeholder/shared";
import ScanButton from "./components/ScanButton";
import ScanProgress from "./components/ScanProgress";
import ScoreGauge from "./components/ScoreGauge";
import ResultsPanel from "./components/ResultsPanel";

export default function App() {
  const [state, setState] = useState<ScanState>("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener = (message: ExtensionMessage) => {
      switch (message.type) {
        case "SCAN_PROGRESS":
          setProgressMessage(message.message);
          setProgressPercent(message.percent);
          break;
        case "SCAN_COMPLETE":
          setResult(message.result);
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
    setResult(null);
    setError(null);

    chrome.runtime.sendMessage({ type: "START_SCAN" } satisfies ExtensionMessage);
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 px-5 py-6" style={{ width: 380 }}>
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-lg font-bold text-surface-900 tracking-tight">
          {APP_NAME}
        </h1>
        <p className="text-xs text-surface-500 mt-0.5">
          UX & accessibility auditor
        </p>
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
      {state === "complete" && result && (
        <div className="animate-fade-in space-y-5">
          <ScoreGauge score={result.overallScore} />
          <ResultsPanel result={result} />
          <button
            onClick={handleReset}
            className="w-full rounded-xl border border-surface-300 bg-white
                       px-4 py-2.5 text-sm font-medium text-surface-700
                       hover:bg-surface-100 transition-colors"
          >
            Scan again
          </button>
        </div>
      )}
    </div>
  );
}
