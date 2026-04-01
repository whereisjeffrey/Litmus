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

function StoryCardItem({
  card,
  onDrillDown,
}: {
  card: StoryCard;
  onDrillDown: (category: string) => void;
}) {
  return (
    <button
      onClick={() => onDrillDown(card.category)}
      className="w-full text-left bg-white rounded-xl p-4 transition-all duration-150 hover:shadow-sm"
      style={{
        borderLeft: `3px solid ${IMPACT_BORDER_COLOR[card.impact]}`,
        border: `1px solid #E5E7EB`,
        borderLeftWidth: "3px",
        borderLeftColor: IMPACT_BORDER_COLOR[card.impact],
      }}
    >
      {/* Icon + Headline */}
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 text-surface-400 mt-0.5">
          {ICON_MAP[card.iconType]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-surface-900 leading-snug">
            {card.headline}
          </p>
        </div>
      </div>

      {/* Narrative */}
      <p className="text-xs text-surface-600 leading-relaxed mt-2.5 ml-[30px]">
        {card.narrative}
      </p>

      {/* Bottom row */}
      <div className="flex items-center gap-2 mt-3 ml-[30px] flex-wrap">
        {/* Finding count badge */}
        <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-2xs font-medium text-surface-600">
          {card.findingCount} issue{card.findingCount !== 1 ? "s" : ""}
        </span>

        {/* Top finding pills */}
        {card.topFindings.slice(0, 2).map((title, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full bg-surface-50 px-2 py-0.5 text-2xs text-surface-400 max-w-[120px] truncate"
          >
            {title}
          </span>
        ))}

        {/* Spacer */}
        <span className="flex-1" />

        {/* View details link */}
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
      {storyCards.map((card) => (
        <StoryCardItem
          key={card.id}
          card={card}
          onDrillDown={onDrillDown}
        />
      ))}
    </div>
  );
}
