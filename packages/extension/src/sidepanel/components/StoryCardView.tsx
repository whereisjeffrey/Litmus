import React from "react";
import type { StoryCard, ScanResult } from "@placeholder/shared";

interface StoryCardViewProps {
  storyCards: StoryCard[];
  result: ScanResult;
  onDrillDown: (category: string) => void;
}

const IMPACT_BORDER_COLOR: Record<StoryCard["impact"], string> = {
  critical: "#F87171",   // red-400
  high: "#FBBF24",       // amber-400
  medium: "#60A5FA",     // blue-400
  low: "#D4D4D4",        // surface-300
};

const ICON_MAP: Record<StoryCard["iconType"], React.ReactNode> = {
  accessibility: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="4" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 8h10M9 8v6M7 17l2-3 2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ux: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 6h16M6 6v11" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  forms: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="11" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 4.5h3M5 13.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  content: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 4h12M3 7.5h10M3 11h8M3 14.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  performance: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 15l3.5-5 3 2.5 4-6.5 3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  security: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L3 5v4c0 4.5 2.5 7.5 6 9 3.5-1.5 6-4.5 6-9V5l-6-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 9l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// Each card section gets a distinct icon color
const CARD_ICON_COLORS = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EC4899", // pink
  "#06B6D4", // cyan
];

// Pick an icon based on keywords in the issue text
function getIssueIcon(issue: string): React.ReactNode {
  const lower = issue.toLowerCase();

  // Mobile / touch / responsive
  if (lower.match(/mobile|touch|tap|phone|responsive|viewport|screen size/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="3.5" y="1" width="7" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Speed / performance / loading
  if (lower.match(/slow|speed|load|performance|image|weight|compress|lazy/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Trust / security / badge
  if (lower.match(/trust|secure|ssl|badge|privacy|safe|credib/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5L2.5 3.5v3c0 3.5 2 5.5 4.5 6.5 2.5-1 4.5-3 4.5-6.5v-3L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    );
  }

  // Navigation / menu / links
  if (lower.match(/nav|menu|link|click|find|search|path|bread/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 4h10M2 7h7M2 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Forms / signup / input / fields
  if (lower.match(/form|field|signup|sign.up|input|label|password|login|register/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="3" width="10" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="2" y="8.5" width="10" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 4.75h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  // Accessibility / screen reader / blind / contrast
  if (lower.match(/access|screen.reader|blind|contrast|alt.text|aria|heading|wcag/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 6h7M7 6v4.5M5.5 12.5l1.5-2 1.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Users / customers / visitors / drop-off
  if (lower.match(/user|customer|visitor|drop|abandon|leave|bounce|churn|lose|losing/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Money / revenue / conversion / cost
  if (lower.match(/revenue|money|cost|conversion|sale|price|pay|checkout|cart/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5v11M9.5 4c0-1.1-1.1-2-2.5-2S4.5 2.9 4.5 4s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Legal / lawsuit / compliance
  if (lower.match(/legal|lawsuit|sue|ada|compliance|regulation/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5L2 5h10L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M3.5 5v5.5M7 5v5.5M10.5 5v5.5M2 10.5h10M1.5 12.5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // SEO / search / Google
  if (lower.match(/seo|search|google|meta|title|description|index|rank/)) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Default — info circle
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 6v4M7 4.5h.005" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function StoryCardItem({
  card,
  cardIndex,
  onDrillDown,
}: {
  card: StoryCard;
  cardIndex: number;
  onDrillDown: (category: string) => void;
}) {
  return (
    <button
      onClick={() => onDrillDown(card.category)}
      className="w-full text-left bg-white rounded-xl p-4 transition-all duration-150 hover:shadow-sm border border-surface-200"
    >
      {/* Category label with blue icon badge */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center">
          {ICON_MAP[card.iconType]}
        </div>
        <span className="text-base font-bold text-surface-900">
          {card.category}
        </span>
      </div>

      {/* Headline */}
      <p className="text-xs font-bold text-surface-600 leading-snug ml-9">
        {card.headline}
      </p>

      {/* Key issues as bullet points with contextual icons in blue circles */}
      {card.topFindings.length > 0 && (
        <div className="mt-2.5 ml-9 space-y-2">
          {card.topFindings.slice(0, 3).map((issue, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-shrink-0 w-4 h-4 text-accent-600 flex items-center justify-center mt-0.5">
                {getIssueIcon(issue)}
              </div>
              <span className="text-xs text-surface-600 leading-snug">
                {issue}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center gap-2 mt-3 ml-9">
        <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-2xs font-medium text-surface-600">
          {card.findingCount} issue{card.findingCount !== 1 ? "s" : ""}
        </span>

        <span className="flex-1" />

        <span className="text-2xs font-medium text-accent-600 flex-shrink-0">
          View details &rarr;
        </span>
      </div>
    </button>
  );
}

export default function StoryCardView({
  storyCards,
  onDrillDown,
}: StoryCardViewProps) {
  if (storyCards.length === 0) return null;

  return (
    <div className="space-y-3">
      {storyCards.map((card, index) => (
        <StoryCardItem
          key={card.id}
          card={card}
          cardIndex={index}
          onDrillDown={onDrillDown}
        />
      ))}
    </div>
  );
}
