import React from "react";

interface ScanButtonProps {
  onScan: () => void;
}

export default function ScanButton({ onScan }: ScanButtonProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center text-center pt-16">
      {/* Magnifying glass icon */}
      <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center mb-5">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-accent-500"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-base font-semibold text-surface-900 mb-1">
        Ready to audit this page?
      </h2>
      <p className="text-sm text-surface-500 mb-8 max-w-[260px] leading-relaxed">
        Checks accessibility, UX, forms, content, and more.
      </p>

      <button onClick={onScan} className="btn-primary w-full">
        Analyze this page
      </button>
    </div>
  );
}
