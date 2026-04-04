import React, { useState } from "react";
import type { StoryCard } from "@placeholder/shared";

interface TopInsightsCardProps {
  storyCards: StoryCard[];
  onViewDetails: (category: string) => void;
}

const FREE_VISIBLE = 2; // Free users see first 2 insights fully

export default function TopInsightsCard({
  storyCards,
  onViewDetails,
}: TopInsightsCardProps) {
  const [unlockedIndex, setUnlockedIndex] = useState<number | null>(null);

  if (!storyCards || storyCards.length === 0) return null;

  const totalCount = storyCards.length;
  const lockedCount = Math.max(0, totalCount - FREE_VISIBLE);

  return (
    <div className="space-y-0">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          className="text-danger-500"
        >
          <path
            d="M9 2L2 15h14L9 2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 7v3M9 12.5h.01"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h2 className="text-base font-bold text-surface-900">
          What's Costing You Customers
        </h2>
      </div>

      {/* Insight cards */}
      <div className="space-y-3">
        {storyCards.map((card, index) => {
          const isLocked = index >= FREE_VISIBLE && unlockedIndex !== index;
          const isUnlocked = unlockedIndex === index;

          return (
            <div key={card.id}>
              {isLocked ? (
                /* Locked insight */
                <button
                  onClick={() => setUnlockedIndex(index)}
                  className="w-full text-left"
                >
                  <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 relative overflow-hidden">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-200 text-surface-400 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-400 leading-snug blur-[2px]">
                          {card.headline}
                        </p>
                        <p className="text-xs text-surface-300 mt-1 blur-[3px]">
                          {card.narrative.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-surface-200">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-surface-400">
                          <rect x="3" y="6" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M5 6V4a2 2 0 114 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <span className="text-xs font-medium text-surface-600">
                          Tap to unlock 1 free insight
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                /* Visible insight (free or unlocked) */
                <button
                  onClick={() => onViewDetails(card.category)}
                  className="w-full text-left"
                >
                  <div className="rounded-xl border border-surface-200 bg-white p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      {/* Number badge */}
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* Headline */}
                        <p className="text-sm font-semibold text-surface-900 leading-snug">
                          {card.headline}
                        </p>

                        {/* Narrative */}
                        <p className="text-xs text-surface-500 leading-relaxed mt-1.5">
                          {card.narrative}
                        </p>

                        {/* Key issues */}
                        {card.topFindings && card.topFindings.length > 0 && (
                          <div className="mt-2.5 space-y-1.5">
                            {card.topFindings.slice(0, 3).map((issue, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-1 h-1 rounded-full bg-accent-400 mt-1.5" />
                                <span className="text-2xs text-surface-500">
                                  {issue}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* View details link */}
                        <div className="mt-3">
                          <span className="text-2xs font-medium text-accent-600">
                            View details &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          );
        })}

        {/* Locked count indicator */}
        {lockedCount > 0 && unlockedIndex === null && (
          <div className="text-center py-2">
            <p className="text-xs text-surface-400">
              + {lockedCount} more insight{lockedCount !== 1 ? "s" : ""} available
            </p>
            <button className="mt-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 px-4 py-1.5 rounded-lg hover:bg-accent-50 transition-colors">
              Unlock all with Pro →
            </button>
          </div>
        )}

        {/* Sample report link */}
        <div className="text-center pt-1">
          <button className="text-2xs text-surface-400 hover:text-accent-600 transition-colors">
            See what a full report looks like →
          </button>
        </div>
      </div>
    </div>
  );
}
