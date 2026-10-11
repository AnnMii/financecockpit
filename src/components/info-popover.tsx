"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * A small "i" button that opens a panel with background information. Unlike
 * a hover tooltip it works with keyboard and touch, and can hold a chart.
 * Place it inside a `relative` container; the panel opens below that.
 */
export function InfoPopover({
  label,
  children,
}: {
  /** What the button shows, for screen readers and as its tooltip. */
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <span ref={container}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex size-5 items-center justify-center rounded-full border text-xs font-semibold ${
          open
            ? "border-accent bg-accent text-on-accent"
            : "border-axis text-ink-2 hover:text-ink"
        }`}
      >
        i
      </button>
      {open && (
        <div
          id={id}
          role="region"
          aria-label={label}
          // On phones a sheet across the screen, from tablet width a panel
          // below the label.
          className="fixed inset-x-4 top-16 z-30 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4 text-sm shadow-lg sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-1 sm:max-h-none sm:w-[28rem] sm:overflow-visible"
        >
          {children}
        </div>
      )}
    </span>
  );
}
