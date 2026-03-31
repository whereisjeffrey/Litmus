import React from "react";
import type { QuickWin } from "@placeholder/shared";

interface HookLineProps {
  hookLine: string;
  quickWins: QuickWin[];
}

const IMPACT_COLOR: Record<string, string> = {
  High: "text-danger-600",
  Medium: "text-warning-600",
};

export default function HookLine({ hookLine, quickWins }: HookLineProps) {
  return (
    <div className="card-elevated bg-accent-50 border-accent-100">
      {/* Smart Insight header */}
      <div className="flex items-start gap-2">
        {/* Sparkle icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-accent-500 flex-shrink-0 mt-0.5"
        >
          <path
            d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <span className="text-xs font-bold text-accent-700">
            Smart Insight
          </span>
          <p className="text-sm font-semibold text-surface-900 leading-snug mt-1">
            {hookLine}
          </p>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="mt-4">
          <span className="text-2xs font-semibold text-surface-500 uppercase tracking-wider">
            Quick Wins
          </span>
          <div className="mt-2">
            {quickWins.map((win, i) => (
              <div key={i}>
                {i > 0 && <div className="divider" />}
                <div className="flex items-center gap-2 py-2.5">
                  {/* Star bullet */}
                  <span className="text-accent-400 flex-shrink-0 text-xs">
                    &#x2726;
                  </span>

                  {/* Title */}
                  <span className="flex-1 min-w-0 text-xs font-medium text-surface-800 truncate">
                    {win.title}
                  </span>

                  {/* Time estimate */}
                  <span className="flex-shrink-0 text-2xs text-surface-400 font-medium">
                    {win.estimatedTime}
                  </span>

                  {/* Impact */}
                  <span
                    className={`flex-shrink-0 text-2xs font-semibold ${
                      IMPACT_COLOR[win.impact] || "text-surface-500"
                    }`}
                  >
                    {win.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
