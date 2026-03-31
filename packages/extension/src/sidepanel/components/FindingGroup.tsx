import React, { useState, useEffect, useMemo } from "react";
import type { Finding, FindingSeverity, ExtensionMessage } from "@placeholder/shared";
import FindingCard from "./FindingCard";
import { humanizeFinding } from "../utils/humanize-finding";

interface FindingGroupProps {
  title: string;
  findings: Finding[];
  severity: FindingSeverity;
  forceCollapsed?: boolean;
}

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const severityDotColor: Record<FindingSeverity, string> = {
  critical: "bg-danger-500",
  warning: "bg-warning-500",
  info: "bg-accent-500",
};

function truncateSelector(selector: string, max = 40): string {
  if (selector.length <= max) return selector;
  return selector.slice(0, max - 3) + "...";
}

export default function FindingGroup({
  title,
  findings,
  severity,
  forceCollapsed,
}: FindingGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Single-instance groups render as a regular FindingCard
  if (findings.length === 1) {
    return (
      <FindingCard finding={findings[0]} forceCollapsed={forceCollapsed} />
    );
  }

  // Collapse when parent accordion closes
  useEffect(() => {
    if (forceCollapsed && expanded) {
      setExpanded(false);
      setActiveInstanceId(null);
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    }
  }, [forceCollapsed]); // intentionally omit expanded

  const humanized = useMemo(() => humanizeFinding(findings[0]), [findings]);
  const description = humanized.humanDescription;

  const handleToggleGroup = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (!willExpand) {
      setActiveInstanceId(null);
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    }
  };

  const handleInstanceClick = (finding: Finding, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeInstanceId === finding.id) {
      setActiveInstanceId(null);
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    } else {
      setActiveInstanceId(finding.id);
      if (finding.selector) {
        chrome.runtime.sendMessage({
          type: "SHOW_ELEMENT",
          selector: finding.selector,
          title: finding.title,
          description: finding.description,
        } satisfies ExtensionMessage);
      }
    }
  };

  const sortedFindings = [...findings].sort(
    (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
  );

  return (
    <div
      className="py-2.5 cursor-pointer animate-slide-up"
      onClick={handleToggleGroup}
    >
      {/* Row header */}
      <div className="flex items-center gap-2.5">
        {/* Severity dot */}
        <span
          className={`flex-shrink-0 w-2 h-2 rounded-full ${severityDotColor[severity]}`}
        />

        {/* Title */}
        <span className="flex-1 min-w-0 text-xs font-medium text-surface-800 truncate">
          {title}
        </span>

        {/* Count */}
        <span className="flex-shrink-0 text-2xs text-surface-400 font-medium">
          &times;{findings.length}
        </span>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`flex-shrink-0 text-surface-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Description (always visible, one line) */}
      <p className="text-2xs text-surface-500 mt-0.5 ml-4 truncate">
        {description}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 ml-4 space-y-0" onClick={(e) => e.stopPropagation()}>
          {/* Instance list */}
          <div className="space-y-0">
            <p className="text-2xs text-surface-400 font-medium mb-1.5">
              Instances:
            </p>
            {sortedFindings.map((finding, i) => {
              const isActive = activeInstanceId === finding.id;
              return (
                <div key={finding.id}>
                  {i > 0 && <div className="border-t border-surface-100" />}
                  <div className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150">
                    {/* Clickable row — shows element on page */}
                    <button
                      onClick={(e) => handleInstanceClick(finding, e)}
                      className={`flex-1 min-w-0 flex items-center gap-2 text-left rounded-md transition-colors duration-150 ${
                        isActive ? "text-accent-700" : ""
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${severityDotColor[finding.severity]}`}
                      />
                      <span className={`flex-1 min-w-0 text-2xs font-mono truncate ${
                        completedIds.has(finding.id) ? "text-surface-400 line-through" : "text-surface-600"
                      }`}>
                        {finding.selector
                          ? truncateSelector(finding.selector)
                          : finding.title}
                      </span>
                    </button>

                    {/* Checkmark — toggles completion */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompletedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(finding.id)) {
                            next.delete(finding.id);
                          } else {
                            next.add(finding.id);
                          }
                          return next;
                        });
                      }}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-colors duration-150"
                    >
                      {completedIds.has(finding.id) ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#22C55E" />
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#D4D4D4" />
                          <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Standard reference */}
          {findings[0].standard && (
            <span className="inline-block mt-2 text-2xs font-mono bg-surface-100 text-surface-500 rounded px-1.5 py-0.5">
              {findings[0].standard}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
