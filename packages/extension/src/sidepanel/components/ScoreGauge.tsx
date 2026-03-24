import React, { useMemo } from "react";

interface ScoreGaugeProps {
  score: number;
}

/**
 * Circular SVG gauge that displays a 0-100 score with color coding.
 * Uses stroke-dasharray/dashoffset for the arc and CSS animation for the fill.
 */
export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  const { color, bg, label } = useMemo(() => {
    if (clampedScore >= 90)
      return { color: "#059669", bg: "#ECFDF5", label: "Excellent" };
    if (clampedScore >= 70)
      return { color: "#10B981", bg: "#ECFDF5", label: "Good" };
    if (clampedScore >= 50)
      return { color: "#F59E0B", bg: "#FFFBEB", label: "Needs work" };
    if (clampedScore >= 30)
      return { color: "#F97316", bg: "#FFF7ED", label: "Poor" };
    return { color: "#EF4444", bg: "#FEF2F2", label: "Critical" };
  }, [clampedScore]);

  // SVG circle math: r=45, circumference = 2 * pi * 45 ~= 282.74
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="relative w-[160px] h-[160px]">
        <svg
          width="160"
          height="160"
          viewBox="0 0 120 120"
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#F5F0E8"
            strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="animate-gauge-fill"
            style={
              {
                "--gauge-offset": dashOffset,
                transition: "stroke-dashoffset 1s ease-out",
              } as React.CSSProperties
            }
          />
        </svg>

        {/* Center score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-surface-900">
            {clampedScore}
          </span>
          <span className="text-2xs font-medium text-surface-500 uppercase tracking-wide">
            out of 100
          </span>
        </div>
      </div>

      {/* Label badge */}
      <div
        className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: bg, color }}
      >
        {label}
      </div>
    </div>
  );
}
