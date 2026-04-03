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
    <div className="p-4 rounded-xl" style={{ backgroundColor: "#ECF8FF" }}>
      {/* Smart Insight header */}
      <div className="flex items-start gap-2">
        {/* 4-point star icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="flex-shrink-0 mt-0.5"
        >
          <path
            d="M12 2C12 2 13.5 8.5 15.5 10.5C17.5 12.5 22 12 22 12C22 12 17.5 13.5 15.5 15.5C13.5 17.5 12 22 12 22C12 22 10.5 17.5 8.5 15.5C6.5 13.5 2 12 2 12C2 12 6.5 10.5 8.5 8.5C10.5 6.5 12 2 12 2Z"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeWidth="0.5"
          />
          <circle cx="19" cy="5" r="1.2" fill="#60A5FA" />
        </svg>
        <div>
          <span className="text-2xs font-medium text-accent-500 uppercase tracking-wide">
            Smart Insight
          </span>
          <p className="text-xs font-medium text-surface-800 leading-snug mt-1">
            {hookLine}
          </p>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="mt-4">
          <span className="text-2xs font-semibold text-surface-500 uppercase tracking-wider">
            Priorities
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
