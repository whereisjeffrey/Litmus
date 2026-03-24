import React from "react";
import type { Finding } from "@placeholder/shared";

interface FindingCardProps {
  finding: Finding;
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

export default function FindingCard({ finding }: FindingCardProps) {
  const config = severityConfig[finding.severity];

  return (
    <div className="card animate-slide-up">
      <div className="flex items-start gap-3">
        {/* Severity icon */}
        <div className="mt-0.5 flex-shrink-0">{config.icon}</div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-surface-900 truncate">
              {finding.title}
            </h4>
          </div>

          {/* Description */}
          <p className="text-xs text-surface-600 leading-relaxed">
            {finding.description}
          </p>

          {/* Footer: severity badge + standard reference */}
          <div className="flex items-center gap-2 mt-2">
            <span className={config.badge}>{finding.severity}</span>
            {finding.standard && (
              <span className="text-2xs text-surface-400 font-mono">
                {finding.standard}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
