import React from "react";
import type { QuickWin } from "@placeholder/shared";

interface HookLineProps {
  hookLine: string;
  quickWins: QuickWin[];
}

const IMPACT_STYLES: Record<string, string> = {
  High: "bg-danger-50 text-danger-600",
  Medium: "bg-warning-50 text-warning-600",
};

export default function HookLine({ hookLine, quickWins }: HookLineProps) {
  return (
    <div className="card space-y-3">
      {/* Hook line */}
      <div>
        <span className="text-2xs font-medium text-surface-400 uppercase tracking-wider">
          AI Insight
        </span>
        <p className="text-sm font-semibold text-surface-900 leading-snug mt-1">
          {hookLine}
        </p>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div>
          <span className="text-2xs font-medium text-surface-400 uppercase tracking-wider">
            Quick Wins
          </span>
          <div className="mt-1.5 space-y-2">
            {quickWins.map((win, i) => (
              <div
                key={i}
                className="rounded-lg bg-surface-50 border border-surface-200 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-surface-800 leading-snug">
                    {win.title}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-2xs font-medium ${
                        IMPACT_STYLES[win.impact] || "bg-surface-100 text-surface-600"
                      }`}
                    >
                      {win.impact}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-surface-100 text-surface-500 px-1.5 py-0.5 text-2xs font-medium">
                      {win.estimatedTime}
                    </span>
                  </div>
                </div>
                <p className="text-2xs text-surface-500 leading-relaxed mt-1">
                  {win.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
