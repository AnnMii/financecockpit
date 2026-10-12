"use client";

import { useEffect, useId, useRef, useState } from "react";

// Time to move the mouse from the button into the panel before it closes.
const CLOSE_DELAY_MS = 150;

/**
 * A small "i" button that shows a panel with background information: while
 * the mouse is over it or it has the keyboard focus, and pinned open after a
 * click, which is also how it works on touch screens. The panel can hold a
 * chart. Place it inside a `relative` container; the panel opens below that.
 */
export function InfoPopover({
  label,
  narrow = false,
  children,
}: {
  /** What the button shows, for screen readers. */
  label: string;
  /** For a few lines of text instead of a chart. */
  narrow?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const container = useRef<HTMLSpanElement>(null);
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  const open = pinned || hovered || focused;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPinned(false);
      setHovered(false);
      setFocused(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setPinned(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closing.current), []);

  return (
    <span
      ref={container}
      // A flex box, so the button sits on the line of the label and not on a
      // text baseline of its own.
      className="inline-flex"
      // A tap also reports the pointer entering; there the click decides.
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        clearTimeout(closing.current);
        setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        clearTimeout(closing.current);
        closing.current = setTimeout(() => setHovered(false), CLOSE_DELAY_MS);
      }}
      onFocus={(event) => {
        // Only focus that came from the keyboard, not from a click.
        if (event.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setPinned((current) => !current)}
        className={`inline-flex size-5 items-center justify-center rounded-full border text-xs font-semibold ${
          pinned
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
          className={`fixed inset-x-4 top-16 z-30 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-line bg-surface p-4 text-sm shadow-lg sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-1 sm:max-h-none sm:overflow-visible ${
            narrow ? "sm:w-72" : "sm:w-[28rem]"
          }`}
        >
          {children}
        </div>
      )}
    </span>
  );
}
