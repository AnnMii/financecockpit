"use client";

import { useId, useState } from "react";
import { formatNumber, parseNumber } from "@/lib/format";
import type { NumberFieldSpec } from "@/lib/settings/schema";

export function SharedBadge() {
  return (
    <span
      title="Geteilte Einstellung – gilt für alle Rechner"
      className="rounded-full bg-accent-wash px-1.5 py-px text-[11px] font-medium text-accent"
    >
      geteilt
    </span>
  );
}

function isValid(value: number, spec: NumberFieldSpec): boolean {
  return (
    Number.isFinite(value) &&
    value >= spec.min &&
    value <= spec.max &&
    (!spec.integer || Number.isInteger(value))
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  spec: NumberFieldSpec;
  unit?: string;
  hint?: React.ReactNode;
  shared?: boolean;
}

/**
 * Text input for numbers in German notation. Only values inside the field's
 * range are passed on, so the settings never hold a half-typed number.
 */
export function NumberField({
  label,
  value,
  onChange,
  spec,
  unit,
  hint,
  shared,
}: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => formatNumber(value));
  const [lastValue, setLastValue] = useState(value);

  // Follow changes made elsewhere, e.g. the same shared field on another page.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseNumber(text) !== value) setText(formatNumber(value));
  }

  const invalid = !isValid(parseNumber(text), spec);

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {shared && <SharedBadge />}
      </div>
      <div
        className={`flex items-center rounded-md border bg-surface focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent ${
          invalid ? "border-critical" : "border-axis"
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode={spec.integer ? "numeric" : "decimal"}
          autoComplete="off"
          value={text}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setText(event.target.value);
            const parsed = parseNumber(event.target.value);
            if (isValid(parsed, spec) && parsed !== value) onChange(parsed);
          }}
          onBlur={() => setText(formatNumber(value))}
          className="w-full min-w-0 bg-transparent px-3 py-2 text-sm tabular-nums text-ink outline-none"
        />
        {unit && (
          <span className="shrink-0 pr-3 text-sm text-muted">{unit}</span>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-1 text-xs text-ink-2">
        {invalid ? (
          <span className="text-critical">
            Bitte {spec.integer ? "eine ganze Zahl" : "einen Wert"} zwischen{" "}
            {formatNumber(spec.min)} und {formatNumber(spec.max)} eingeben.
          </span>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-2">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </section>
  );
}
