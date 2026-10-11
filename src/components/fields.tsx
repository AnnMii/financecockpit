"use client";

import { createContext, useContext, useId, useState } from "react";
import type { NumberFieldSpec } from "@/lib/settings/schema";
import { useLocale } from "./locale-provider";

const HideSharedBadges = createContext(false);

/**
 * Leaves out the "shared" badges of the fields inside, for pages where every
 * field is a shared one.
 */
export function WithoutSharedBadges({ children }: { children: React.ReactNode }) {
  return <HideSharedBadges value={true}>{children}</HideSharedBadges>;
}

export function SharedBadge() {
  const { t } = useLocale();
  const hidden = useContext(HideSharedBadges);
  if (hidden) return null;
  return (
    <span
      title={t.common.sharedTitle}
      className="rounded-full bg-accent-wash px-1.5 py-px text-[11px] font-medium text-accent"
    >
      {t.common.shared}
    </span>
  );
}

export function ChangedBadge() {
  const { t } = useLocale();
  return (
    <span
      title={t.common.changedTitle}
      className="rounded-full border border-axis px-1.5 py-px text-[11px] font-medium text-ink-2"
    >
      {t.common.changed}
    </span>
  );
}

export interface SliderSpec {
  min: number;
  max: number;
  step: number;
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
  /** Marks a value that differs from the saved settings. */
  changed?: boolean;
  /** Adds a slider below the input; it may cover less than the full range. */
  slider?: SliderSpec;
  /** Extra element after the label, e.g. an <InfoPopover>. */
  info?: React.ReactNode;
}

/**
 * Text input for numbers in the notation of the current language. Only values
 * inside the field's range are passed on, so the settings never hold a
 * half-typed number.
 */
export function NumberField({
  label,
  value,
  onChange,
  spec,
  unit,
  hint,
  shared,
  changed,
  slider,
  info,
}: NumberFieldProps) {
  const id = useId();
  const { locale, t, f } = useLocale();
  const [text, setText] = useState(() => f.number(value));
  const [shown, setShown] = useState({ value, locale });

  // Follow changes made elsewhere (the same shared field on another page, a
  // slider, a profile switch) and re-write the number when the language changes.
  if (value !== shown.value || locale !== shown.locale) {
    const languageChanged = locale !== shown.locale;
    setShown({ value, locale });
    if (languageChanged || f.parse(text) !== value) setText(f.number(value));
  }

  const invalid = !isValid(f.parse(text), spec);

  return (
    <div>
      <div className="relative mb-1 flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {shared && <SharedBadge />}
        {changed && <ChangedBadge />}
        {info}
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
            const parsed = f.parse(event.target.value);
            if (isValid(parsed, spec) && parsed !== value) onChange(parsed);
          }}
          onBlur={() => setText(f.number(value))}
          className="w-full min-w-0 bg-transparent px-3 py-2 text-sm tabular-nums text-ink outline-none"
        />
        {unit && (
          <span className="shrink-0 pr-3 text-sm text-muted">{unit}</span>
        )}
      </div>
      {slider && (
        <input
          type="range"
          aria-label={label}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={Math.min(slider.max, Math.max(slider.min, value))}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-2 block w-full accent-(--accent)"
        />
      )}
      <p id={`${id}-hint`} className="mt-1 text-xs text-ink-2">
        {invalid ? (
          <span className="text-critical">
            {t.common.numberRange(
              spec.integer ?? false,
              f.number(spec.min),
              f.number(spec.max),
            )}
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

function FieldLabel({
  label,
  shared,
  changed,
}: {
  label: string;
  shared?: boolean;
  changed?: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
      {label}
      {shared && <SharedBadge />}
      {changed && <ChangedBadge />}
    </span>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  hint,
  shared,
  changed,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: React.ReactNode;
  shared?: boolean;
  changed?: boolean;
}) {
  return (
    <div>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-(--accent)"
        />
        <FieldLabel label={label} shared={shared} changed={changed} />
      </label>
      {hint && <p className="mt-1 text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  shared,
  changed,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: React.ReactNode;
  shared?: boolean;
  changed?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block">
        <FieldLabel label={label} shared={shared} changed={changed} />
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-axis bg-surface px-3 py-2 text-sm text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-ink-2">{hint}</span>}
    </label>
  );
}
