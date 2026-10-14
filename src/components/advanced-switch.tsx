"use client";

import { useLocale } from "./locale-provider";

/**
 * "Advanced inputs" switch at the top of a form. When `forced` (an error that
 * may be caused by a hidden input) the inputs stay shown and the switch is
 * locked, with a note why.
 */
export function AdvancedSwitch({
  checked,
  forced = false,
  onChange,
}: {
  checked: boolean;
  forced?: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useLocale();
  return (
    <div>
      <label className="flex items-center justify-between gap-3 text-sm font-medium text-ink">
        {t.common.advancedToggle}
        <input
          type="checkbox"
          checked={checked || forced}
          disabled={forced}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-(--accent)"
        />
      </label>
      {forced && (
        <p className="mt-1 text-xs text-ink-2">{t.common.advancedForced}</p>
      )}
    </div>
  );
}
