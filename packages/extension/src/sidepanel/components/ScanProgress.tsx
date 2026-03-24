import React from "react";

interface ScanProgressProps {
  message: string;
  percent: number;
}

export default function ScanProgress({ message, percent }: ScanProgressProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center pt-12">
      {/* Pulsing indicator */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full bg-accent-200 animate-ping opacity-20" />
        <div className="relative w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-accent-500 animate-spin"
            style={{ animationDuration: "2s" }}
          >
            <path
              d="M12 2C6.477 2 2 6.477 2 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <p className="text-sm font-medium text-surface-800 mb-2">{message}</p>

      {/* Progress bar */}
      <div className="w-full max-w-[240px] h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-surface-400 mt-2">{percent}%</p>
    </div>
  );
}
