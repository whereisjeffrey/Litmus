import React from "react";

interface PlaceholderBoxProps {
  label: string;
  height?: number;
}

/**
 * A simple labeled placeholder box used as a stand-in for
 * components that haven't been designed yet.
 */
export default function PlaceholderBox({ label, height = 80 }: PlaceholderBoxProps) {
  return (
    <div
      className="rounded-lg border-2 border-dashed border-surface-300 bg-surface-100
                 flex items-center justify-center"
      style={{ height }}
    >
      <span className="text-xs font-medium text-surface-500 tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}
