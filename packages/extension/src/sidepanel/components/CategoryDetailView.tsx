import React, { useState } from "react";
import type { Finding, FindingSeverity } from "@placeholder/shared";
import FindingGroup from "./FindingGroup";

interface CategoryDetailViewProps {
  category: string;
  findings: Finding[];
  onBack: () => void;
}

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

function highestSeverity(findings: Finding[]): FindingSeverity {
  let max: FindingSeverity = "info";
  for (const f of findings) {
    if (SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[max]) {
      max = f.severity;
    }
  }
  return max;
}

interface GroupedFinding {
  title: string;
  findings: Finding[];
  severity: FindingSeverity;
  impactScore: number;
}

function groupFindings(findings: Finding[]): GroupedFinding[] {
  const map = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = map.get(f.title);
    if (list) {
      list.push(f);
    } else {
      map.set(f.title, [f]);
    }
  }

  const groups: GroupedFinding[] = [];
  for (const [title, items] of map) {
    const sev = highestSeverity(items);
    groups.push({
      title,
      findings: items,
      severity: sev,
      impactScore: items.length * SEVERITY_WEIGHT[sev],
    });
  }

  groups.sort((a, b) => b.impactScore - a.impactScore);
  return groups;
}

const DEFAULT_VISIBLE = 8;

export default function CategoryDetailView({
  category,
  findings,
  onBack,
}: CategoryDetailViewProps) {
  const [showAll, setShowAll] = useState(false);
  const findingGroups = groupFindings(findings);
  const totalGroupTypes = findingGroups.length;
  const visibleGroups = showAll
    ? findingGroups
    : findingGroups.slice(0, DEFAULT_VISIBLE);
  const hasMore = totalGroupTypes > DEFAULT_VISIBLE;

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors mb-4"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M9 3L5 7l4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to overview
      </button>

      {/* Category heading */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-surface-900">{category}</h2>
        <p className="text-2xs text-surface-500 mt-0.5">
          {findings.length} issue{findings.length !== 1 ? "s" : ""} found
          {totalGroupTypes > 1 &&
            ` across ${totalGroupTypes} issue type${totalGroupTypes !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Finding groups */}
      <div className="card">
        {visibleGroups.map((fg, i) => (
          <div key={fg.title}>
            {i > 0 && <div className="divider" />}
            <FindingGroup
              title={fg.title}
              findings={fg.findings}
              severity={fg.severity}
              forceCollapsed={false}
            />
          </div>
        ))}

        {/* Show more */}
        {hasMore && !showAll && (
          <div className="pt-2 pb-1">
            <button
              onClick={() => setShowAll(true)}
              className="text-2xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
            >
              See all {totalGroupTypes} issue types &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
