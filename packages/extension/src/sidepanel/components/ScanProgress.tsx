import React from "react";

interface ScanProgressProps {
  message: string;
  percent: number;
}

export default function ScanProgress({ message, percent }: ScanProgressProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center pt-16">
      {/* Spinner */}
      <div className="relative w-12 h-12 mb-6">
        <div className="absolute inset-0 rounded-full bg-accent-50 animate-pulse-soft" />
        <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center">
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

      <p className="text-sm text-surface-600 mb-3">{message}</p>

      {/* Thin progress bar */}
      <div className="w-full max-w-[220px] h-1 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs font-bold text-surface-800 mt-2 tabular-nums">
        {percent}%
      </p>
    </div>
  );
}
