import React, { useState, useCallback, useEffect, useMemo } from "react";
import type { Finding, FindingSeverity, ExtensionMessage } from "@placeholder/shared";
import { humanizeFinding } from "../utils/humanize-finding";

interface FindingCardProps {
  finding: Finding;
  forceCollapsed?: boolean;
}

const severityDotColor: Record<FindingSeverity, string> = {
  critical: "bg-danger-500",
  warning: "bg-warning-500",
  info: "bg-accent-500",
};

const severityBadge: Record<FindingSeverity, string> = {
  critical: "badge-critical",
  warning: "badge-warning",
  info: "badge-info",
};

export default function FindingCard({ finding, forceCollapsed }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const humanized = useMemo(() => humanizeFinding(finding), [finding]);

  useEffect(() => {
    if (forceCollapsed && expanded) {
      setExpanded(false);
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    }
  }, [forceCollapsed]);

  const toggleExpand = useCallback(() => {
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand && finding.selector) {
      chrome.runtime.sendMessage({
        type: "SHOW_ELEMENT",
        selector: finding.selector,
        title: finding.title,
        description: finding.description,
      } satisfies ExtensionMessage);
    } else {
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    }
  }, [expanded, finding]);

  const shortDescription =
    humanized.humanDescription.length > 80
      ? humanized.humanDescription.slice(0, 77) + "..."
      : humanized.humanDescription;

  return (
    <div
      className="py-2.5 cursor-pointer animate-slide-up"
      onClick={toggleExpand}
    >
      {/* Row header */}
      <div className="flex items-center gap-2.5">
        {/* Severity dot */}
        <span
          className={`flex-shrink-0 w-2 h-2 rounded-full ${severityDotColor[finding.severity]}`}
        />

        {/* Title */}
        <span className="flex-1 min-w-0 text-xs font-medium text-surface-800 truncate">
          {finding.title}
        </span>

        {/* Severity badge */}
        <span className={`flex-shrink-0 ${severityBadge[finding.severity]}`}>
          {finding.severity}
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

      {/* Short description */}
      <p className="text-2xs text-surface-500 mt-0.5 ml-4 truncate">
        {expanded ? humanized.humanDescription : shortDescription}
      </p>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 ml-4 space-y-2">
          {/* Why this matters */}
          <p className="text-2xs text-surface-500 italic leading-relaxed">
            <span className="font-medium not-italic text-surface-600">
              Why this matters:{" "}
            </span>
            {humanized.whyItMatters}
          </p>

          {/* Standard reference */}
          {finding.standard && (
            <span className="inline-block text-2xs font-mono bg-surface-100 text-surface-500 rounded px-1.5 py-0.5">
              {finding.standard}
            </span>
          )}

          {/* Scanner source */}
          <p className="text-2xs text-surface-400">
            Scanner: {finding.scanner}
          </p>

          {/* Selector preview */}
          {finding.selector && (
            <p className="text-2xs text-surface-400 font-mono truncate">
              {finding.selector}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
