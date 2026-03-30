import React, { useState } from "react";
import type { ScanResult, FindingSeverity } from "@placeholder/shared";
import FindingCard from "./FindingCard";

interface ResultsPanelProps {
  result: ScanResult;
}

const SEVERITY_ORDER: FindingSeverity[] = ["critical", "warning", "info"];

export default function ResultsPanel({ result }: ResultsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FindingSeverity | "all">(
    "all"
  );

  const criticalCount = result.allFindings.filter(
    (f) => f.severity === "critical"
  ).length;
  const warningCount = result.allFindings.filter(
    (f) => f.severity === "warning"
  ).length;
  const infoCount = result.allFindings.filter(
    (f) => f.severity === "info"
  ).length;

  const filteredFindings =
    activeFilter === "all"
      ? result.allFindings
      : result.allFindings.filter((f) => f.severity === activeFilter);

  return (
    <div className="space-y-4">
      {/* Category scores */}
      <div className="card">
        <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
          Categories
        </h3>
        <div className="space-y-2.5">
          {result.categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-surface-700">
                  {cat.name}
                </span>
                <span className="text-xs font-semibold text-surface-900">
                  {cat.score}
                </span>
              </div>
              <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${cat.score}%`,
                    backgroundColor:
                      cat.score >= 80
                        ? "#10B981"
                        : cat.score >= 50
                          ? "#F59E0B"
                          : "#EF4444",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-danger-500">{criticalCount}</p>
          <p className="text-2xs text-surface-500">Critical</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-warning-500">{warningCount}</p>
          <p className="text-2xs text-surface-500">Warnings</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-lg font-bold text-accent-500">{infoCount}</p>
          <p className="text-2xs text-surface-500">Info</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
        {(["all", ...SEVERITY_ORDER] as const).map((filter) => {
          const isActive = activeFilter === filter;
          const count =
            filter === "all"
              ? result.allFindings.length
              : filter === "critical"
                ? criticalCount
                : filter === "warning"
                  ? warningCount
                  : infoCount;

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-2xs font-semibold transition-colors ${
                isActive
                  ? "bg-white text-surface-900 shadow-soft"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}{" "}
              ({count})
            </button>
          );
        })}
      </div>

      {/* Findings list */}
      <div className="space-y-2">
        {filteredFindings.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm text-surface-500">
              No {activeFilter === "all" ? "" : activeFilter + " "}findings
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))
        )}
      </div>

    </div>
  );
}
