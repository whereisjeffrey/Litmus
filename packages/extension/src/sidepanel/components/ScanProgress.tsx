import React from "react";

interface ScanProgressProps {
  message: string;
  percent: number;
}

export default function ScanProgress({ message, percent }: ScanProgressProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center pt-16">
      {/* Pulsing ring indicator */}
      <div className="relative w-14 h-14 mb-6">
        <div className="absolute inset-0 rounded-full bg-accent-100 animate-pulse-soft" />
        <div className="relative w-14 h-14 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-accent-500 animate-spin"
            style={{ animationDuration: "1.5s" }}
          >
            <path
              d="M10 2C5.582 2 2 5.582 2 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <p className="text-sm font-medium text-surface-800 mb-3">{message}</p>

      {/* Progress bar */}
      <div className="w-full max-w-[220px] h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-2xs text-surface-400 mt-2 tabular-nums">{percent}%</p>
    </div>
  );
}
