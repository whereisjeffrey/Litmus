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

// Category accent colors
const CATEGORY_COLORS: Record<string, string> = {
  Accessibility: "#7BA3C4",
  Forms: "#6BA8A0",
  Content: "#C4A04E",
  Visual: "#C48A9A",
  "UX Heuristics": "#9B82B8",
  Performance: "#8893A6",
};

// Stable display order
const CATEGORY_ORDER = [
  "Accessibility",
  "UX Heuristics",
  "Forms",
  "Content",
  "Performance",
];

interface CategoryGroup {
  name: string;
  color: string;
  score: number;
  findings: Finding[];
}

function buildCategoryGroups(result: ScanResult): CategoryGroup[] {
  // Group findings by mapped category
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

  // Build category groups with scores from result.categories
  const scoreMap = new Map<string, CategoryScore>();
  for (const cat of result.categories) {
    scoreMap.set(cat.name, cat);
  }

  // Collect all categories: known order first, then any extras
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
      color: CATEGORY_COLORS[name] || "#8893A6",
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

// Get the highest severity in a list of findings
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

  // Sort by impact score descending
  groups.sort((a, b) => b.impactScore - a.impactScore);
  return groups;
}

const DEFAULT_VISIBLE_GROUPS = 5;

function CategoryCard({
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

  // Estimate point recovery from the visible top groups
  const topPointRecovery = findingGroups
    .slice(0, DEFAULT_VISIBLE_GROUPS)
    .reduce((sum, g) => sum + g.impactScore, 0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, group.findings.length, showAllGroups]);

  // Reset "show all" when accordion closes
  useEffect(() => {
    if (!isOpen) {
      setShowAllGroups(false);
    }
  }, [isOpen]);

  return (
    <div
      className="rounded-xl bg-white shadow-soft overflow-hidden transition-shadow duration-200"
      style={{ borderLeft: `3px solid ${isEmpty ? "#D5D3CD" : group.color}` }}
    >
      {/* Header */}
      <button
        onClick={isEmpty ? undefined : onToggle}
        disabled={isEmpty}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 ${
          isEmpty
            ? "cursor-default opacity-50"
            : "cursor-pointer hover:bg-surface-50"
        } ${isOpen ? "bg-surface-50" : ""}`}
      >
        {/* Left: name + score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-xs font-semibold ${isEmpty ? "text-surface-400" : "text-surface-800"}`}
            >
              {group.name}
            </span>
            <span
              className={`text-xs font-bold ${isEmpty ? "text-surface-400" : "text-surface-900"}`}
            >
              {group.score}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${group.score}%`,
                backgroundColor: isEmpty ? "#D5D3CD" : group.color,
              }}
            />
          </div>

          {/* Issue count */}
          <p
            className={`text-2xs mt-1 ${isEmpty ? "text-surface-400" : "text-surface-500"}`}
          >
            {group.findings.length === 0
              ? "No issues"
              : `${group.findings.length} issue${group.findings.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Chevron */}
        {!isEmpty && (
          <div className="flex-shrink-0 text-surface-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M4 5.5L7 8.5L10 5.5"
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
        <div ref={contentRef} className="px-3 pb-3 space-y-2">
          {/* Group summary header */}
          {totalGroupTypes > 1 && (
            <p className="text-2xs text-surface-500 pt-1">
              {totalGroupTypes} issue type{totalGroupTypes === 1 ? "" : "s"} found
              {" · "}
              <span className="font-medium text-surface-700">
                Fix these first:
              </span>
            </p>
          )}

          {/* Grouped finding cards */}
          {visibleGroups.map((fg) => (
            <FindingGroup
              key={fg.title}
              title={fg.title}
              findings={fg.findings}
              severity={fg.severity}
              forceCollapsed={!isOpen}
            />
          ))}

          {/* Show more / recovery estimate */}
          {hasMoreGroups && !showAllGroups && (
            <div className="space-y-1 pt-1">
              <p className="text-2xs text-surface-400">
                Fixing these would recover ~{topPointRecovery} points
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllGroups(true);
                }}
                className="text-2xs font-medium text-accent-500 hover:text-accent-600 transition-colors"
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
    <div className="space-y-2">
      {groups.map((group) => (
        <CategoryCard
          key={group.name}
          group={group}
          isOpen={openCategory === group.name}
          onToggle={() => handleToggle(group.name)}
        />
      ))}
    </div>
  );
}
