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
      // Deselect
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

  // Sort instances by severity (critical first)
  const sortedFindings = [...findings].sort(
    (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
  );

  return (
    <div
      className="card animate-slide-up cursor-pointer"
      onClick={handleToggleGroup}
    >
      {/* Collapsed header — always visible */}
      <div className="flex items-center gap-2.5">
        {/* Severity dot */}
        <span
          className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${severityDotColor[severity]}`}
        />

        {/* Title + count */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h4 className="text-sm font-medium text-surface-900">
            {title}
          </h4>
          {findings.length > 1 && (
            <span className="flex-shrink-0 text-2xs text-surface-400 font-medium">
              &times;{findings.length}
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <div className="flex-shrink-0 text-surface-400">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
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
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          {/* Group description from first finding */}
          <p className="text-xs text-surface-600 leading-relaxed">
            {description}
          </p>

          {/* Instance list */}
          <div className="border-t border-surface-200 pt-2 space-y-1">
            <p className="text-2xs text-surface-400 font-medium mb-1.5">
              Instances:
            </p>
            {sortedFindings.map((finding) => {
              const isActive = activeInstanceId === finding.id;
              return (
                <button
                  key={finding.id}
                  onClick={(e) => handleInstanceClick(finding, e)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors duration-150 ${
                    isActive
                      ? "bg-accent-50 border border-accent-200"
                      : "hover:bg-surface-50 border border-transparent"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${severityDotColor[finding.severity]}`}
                  />
                  <span className="flex-1 min-w-0 text-2xs font-mono text-surface-600 truncate">
                    {finding.selector
                      ? truncateSelector(finding.selector)
                      : finding.title}
                  </span>
                  <span className="flex-shrink-0 text-2xs text-accent-500 font-medium">
                    Show
                  </span>
                </button>
              );
            })}
          </div>

          {/* Standard reference from first finding */}
          {findings[0].standard && (
            <p className="text-2xs text-surface-400 font-mono mt-1">
              {findings[0].standard}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
