import React, { useState, useRef, useEffect } from "react";
import type { ScanResult, Finding, FindingSeverity, CategoryScore } from "@placeholder/shared";
import FindingCard from "./FindingCard";
import FindingGroup from "./FindingGroup";

interface CategoryAccordionProps {
  result: ScanResult;
}

// Scanner-to-display-category mapping
const SCANNER_CATEGORY: Record<string, string> = {
  "contrast-checker": "Accessibility",
  "heading-checker": "Accessibility",
  "image-auditor": "Accessibility",
  "form-analyzer": "Forms",
  "link-validator": "Content",
  "meta-checker": "Content",
  "touch-targets": "UX Heuristics",
  "console-capture": "Performance",
};

// Stable display order
const CATEGORY_ORDER = [
  "Accessibility",
  "UX Heuristics",
  "Forms",
  "Content",
  "Performance",
];

// Category icon SVGs (small, monoline, blue)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Accessibility: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 6h8M7 6v5M5 13l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "UX Heuristics": (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Forms: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 4h2M3.5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Content: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3h10M2 6h8M2 9h6M2 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Performance: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 12l3-4 3 2 3-5 3-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

interface CategoryGroup {
  name: string;
  score: number;
  findings: Finding[];
}

function buildCategoryGroups(result: ScanResult): CategoryGroup[] {
  const grouped: Record<string, Finding[]> = {};
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }

  for (const finding of result.allFindings) {
    const category = SCANNER_CATEGORY[finding.scanner] || finding.scanner;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(finding);
  }

  const scoreMap = new Map<string, CategoryScore>();
  for (const cat of result.categories) {
    scoreMap.set(cat.name, cat);
  }

  const allCategoryNames = new Set(CATEGORY_ORDER);
  for (const key of Object.keys(grouped)) {
    allCategoryNames.add(key);
  }

  const groups: CategoryGroup[] = [];
  for (const name of allCategoryNames) {
    const findings = grouped[name] || [];
    const catScore = scoreMap.get(name);
    groups.push({
      name,
      score: catScore ? catScore.score : 100,
      findings,
    });
  }

  return groups;
}

// Severity weights for sorting groups by impact
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

const DEFAULT_VISIBLE_GROUPS = 5;

function CategoryRow({
  group,
  isOpen,
  onToggle,
}: {
  group: CategoryGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const isEmpty = group.findings.length === 0;

  const findingGroups = groupFindings(group.findings);
  const totalGroupTypes = findingGroups.length;
  const visibleGroups = showAllGroups
    ? findingGroups
    : findingGroups.slice(0, DEFAULT_VISIBLE_GROUPS);
  const hasMoreGroups = totalGroupTypes > DEFAULT_VISIBLE_GROUPS;

  const topPointRecovery = findingGroups
    .slice(0, DEFAULT_VISIBLE_GROUPS)
    .reduce((sum, g) => sum + g.impactScore, 0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, group.findings.length, showAllGroups]);

  useEffect(() => {
    if (!isOpen) {
      setShowAllGroups(false);
    }
  }, [isOpen]);

  // Progress bar color based on score
  const barColor =
    group.score >= 90
      ? "#22C55E"
      : group.score >= 75
        ? "#3B82F6"
        : group.score >= 50
          ? "#F59E0B"
          : "#EF4444";

  return (
    <div>
      {/* Header row */}
      <button
        onClick={isEmpty ? undefined : onToggle}
        disabled={isEmpty}
        className={`w-full flex items-center gap-3 py-3 text-left transition-colors duration-150 ${
          isEmpty
            ? "cursor-default opacity-40"
            : "cursor-pointer hover:bg-surface-50 -mx-1 px-1 rounded-lg"
        }`}
      >
        {/* Category icon badge */}
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
            isEmpty ? "bg-surface-100 text-surface-400" : "bg-accent-50 text-accent-500"
          }`}
        >
          {CATEGORY_ICONS[group.name] || CATEGORY_ICONS["Performance"]}
        </div>

        {/* Name + progress bar + issue count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-semibold ${
                isEmpty ? "text-surface-400" : "text-surface-800"
              }`}
            >
              {group.name}
            </span>
            <span
              className={`text-sm font-bold tabular-nums ${
                isEmpty ? "text-surface-400" : "text-surface-900"
              }`}
            >
              {group.score}
            </span>
          </div>

          {/* Thin progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${group.score}%`,
                  backgroundColor: isEmpty ? "#D4D4D4" : barColor,
                }}
              />
            </div>
            <span
              className={`text-2xs flex-shrink-0 ${
                isEmpty ? "text-surface-400" : "text-surface-500"
              }`}
            >
              {group.findings.length === 0
                ? "No issues"
                : `${group.findings.length} issue${group.findings.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {/* Chevron */}
        {!isEmpty && (
          <div className="flex-shrink-0 text-surface-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            >
              <path
                d="M5 4l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Expandable content */}
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: isOpen ? contentHeight + 16 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pl-10 pb-3 space-y-0">
          {/* Group summary header */}
          {totalGroupTypes > 1 && (
            <p className="text-2xs text-surface-500 pb-2">
              {totalGroupTypes} issue type{totalGroupTypes === 1 ? "" : "s"} found
              {" · "}
              <span className="font-medium text-surface-700">
                Fix these first:
              </span>
            </p>
          )}

          {/* Grouped findings — rows with dividers */}
          {visibleGroups.map((fg, i) => (
            <div key={fg.title}>
              {i > 0 && <div className="divider" />}
              <FindingGroup
                title={fg.title}
                findings={fg.findings}
                severity={fg.severity}
                forceCollapsed={!isOpen}
              />
            </div>
          ))}

          {/* Show more */}
          {hasMoreGroups && !showAllGroups && (
            <div className="pt-2">
              <p className="text-2xs text-surface-400">
                Fixing these would recover ~{topPointRecovery} points
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllGroups(true);
                }}
                className="text-2xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
              >
                See all {totalGroupTypes} issue types &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoryAccordion({ result }: CategoryAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const groups = buildCategoryGroups(result);

  const handleToggle = (name: string) => {
    setOpenCategory((prev) => (prev === name ? null : name));
  };

  return (
    <div className="card">
      {groups.map((group, i) => (
        <div key={group.name}>
          {i > 0 && <div className="divider" />}
          <CategoryRow
            group={group}
            isOpen={openCategory === group.name}
            onToggle={() => handleToggle(group.name)}
          />
        </div>
      ))}
    </div>
  );
}
