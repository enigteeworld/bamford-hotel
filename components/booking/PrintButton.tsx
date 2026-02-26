// components/booking/PrintButton.tsx
"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-[var(--line)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] hover:bg-black/[0.02]"
    >
      Print / Save
    </button>
  );
}