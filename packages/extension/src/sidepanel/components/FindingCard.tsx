import React, { useState, useCallback, useEffect, useMemo } from "react";
import type { Finding, ExtensionMessage } from "@placeholder/shared";
import { humanizeFinding } from "../utils/humanize-finding";

interface FindingCardProps {
  finding: Finding;
  forceCollapsed?: boolean;
}

const severityConfig = {
  critical: {
    badge: "badge-critical",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 4v3.5M7 9.5h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    badge: "badge-warning",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M6.134 2.5a1 1 0 011.732 0l4.83 8.37A1 1 0 0111.83 12.5H2.17a1 1 0 01-.866-1.5l4.83-8.37z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M7 6v2M7 10h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    badge: "badge-info",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 6.5v4M7 4.5h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
};

export default function FindingCard({ finding, forceCollapsed }: FindingCardProps) {
  const config = severityConfig[finding.severity];
  const [expanded, setExpanded] = useState(false);
  const humanized = useMemo(() => humanizeFinding(finding), [finding]);

  // When parent accordion closes, collapse this card and dismiss highlight
  useEffect(() => {
    if (forceCollapsed && expanded) {
      setExpanded(false);
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    }
  }, [forceCollapsed]); // intentionally omit expanded to avoid re-triggering

  const toggleExpand = useCallback(() => {
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand && finding.selector) {
      // Auto-show element on expand
      chrome.runtime.sendMessage({
        type: "SHOW_ELEMENT",
        selector: finding.selector,
        title: finding.title,
        description: finding.description,
      } satisfies ExtensionMessage);
    } else {
      // Auto-hide element on collapse
      chrome.runtime.sendMessage({
        type: "HIDE_ELEMENT",
      } satisfies ExtensionMessage);
    }
  }, [expanded, finding]);

  // Truncate description for collapsed view
  const shortDescription =
    humanized.humanDescription.length > 80
      ? humanized.humanDescription.slice(0, 77) + "..."
      : humanized.humanDescription;

  return (
    <div
      className="card animate-slide-up cursor-pointer"
      onClick={toggleExpand}
    >
      <div className="flex items-start gap-3">
        {/* Severity icon */}
        <div className="mt-0.5 flex-shrink-0">{config.icon}</div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className={config.badge}>{finding.severity}</span>
            <h4 className="text-sm font-medium text-surface-900">
              {finding.title}
            </h4>
          </div>

          {/* Description — collapsed: one line, expanded: full */}
          <p className="text-xs text-surface-600 leading-relaxed">
            {expanded ? humanized.humanDescription : shortDescription}
          </p>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-2 space-y-2">
              {/* Why this matters */}
              <p className="text-xs text-surface-500 italic leading-relaxed">
                <span className="font-medium not-italic text-surface-600">Why this matters: </span>
                {humanized.whyItMatters}
              </p>

              {/* Standard reference */}
              {finding.standard && (
                <div className="flex items-center gap-1">
                  <span className="text-2xs text-surface-400 font-mono">
                    {finding.standard}
                  </span>
                </div>
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

        {/* Expand chevron */}
        <div className="mt-1 flex-shrink-0 text-surface-400">
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
    </div>
  );
}
