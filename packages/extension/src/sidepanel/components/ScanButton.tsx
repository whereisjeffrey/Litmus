import React from "react";

interface ScanButtonProps {
  onScan: () => void;
}

export default function ScanButton({ onScan }: ScanButtonProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center pt-12">
      {/* Decorative icon */}
      <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center mb-5">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          className="text-accent-500"
        >
          <path
            d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2zm0 22c-5.523 0-10-4.477-10-10S8.477 4 14 4s10 4.477 10 10-4.477 10-10 10z"
            fill="currentColor"
            opacity="0.3"
          />
          <path
            d="M14 6a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
            fill="currentColor"
            opacity="0.5"
          />
          <circle cx="14" cy="14" r="3" fill="currentColor" />
        </svg>
      </div>

      <h2 className="text-base font-semibold text-surface-900 mb-1.5">
        Ready to see what I find?
      </h2>
      <p className="text-sm text-surface-500 mb-8 max-w-[260px]">
        I'll scan this page for accessibility issues, UX problems, and
        opportunities to improve.
      </p>

      <button onClick={onScan} className="btn-primary w-full">
        Analyze this page
      </button>
    </div>
  );
}
