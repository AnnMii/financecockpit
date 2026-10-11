"use client";

import { formatEuro } from "@/lib/format";
import { numberText, selectText, toggleText } from "@/lib/settings/labels";
import {
  type AllSettings,
  MAX_CHILDREN,
  type NumberFieldName,
  type NumberFieldSpec,
  type SelectFieldName,
  type SettingsScope,
  type ToggleFieldName,
  childBirthYearSpec,
  numberFields,
  selectFields,
} from "@/lib/settings/schema";
import {
  ChangedBadge,
  NumberField,
  SelectField,
  SharedBadge,
  type SliderSpec,
  ToggleField,
} from "./fields";
import { useSettingsEditor } from "./settings-provider";

/**
 * Input fields bound to one setting. They read and write through the settings
 * editor, so inside a calculator they work on the local draft. Fields of the
 * "shared" scope are marked as shared between calculators.
 */

export function NumberSetting<S extends SettingsScope>({
  scope,
  name,
  label,
  unit,
  hint,
  slider,
}: {
  scope: S;
  name: NumberFieldName<S>;
  /** Overrides for calculators that call a shared value differently. */
  label?: string;
  unit?: string;
  hint?: React.ReactNode;
  slider?: SliderSpec;
}) {
  const { settings, update, isChanged } = useSettingsEditor();
  const text = numberText[scope][name];
  const spec = (numberFields[scope] as Record<string, NumberFieldSpec>)[name];
  return (
    <NumberField
      label={label ?? text.label}
      unit={unit ?? text.unit}
      hint={hint ?? text.hint}
      spec={spec}
      value={(settings[scope] as Record<string, number>)[name]}
      onChange={(value) =>
        update(scope, { [name]: value } as Partial<AllSettings[S]>)
      }
      shared={scope === "shared"}
      changed={isChanged(scope, name)}
      slider={slider}
    />
  );
}

export function ToggleSetting<S extends SettingsScope>({
  scope,
  name,
}: {
  scope: S;
  name: ToggleFieldName<S>;
}) {
  const { settings, update, isChanged } = useSettingsEditor();
  const text = toggleText[scope][name];
  return (
    <ToggleField
      label={text.label}
      hint={text.hint}
      checked={(settings[scope] as Record<string, boolean>)[name]}
      onChange={(checked) =>
        update(scope, { [name]: checked } as Partial<AllSettings[S]>)
      }
      shared={scope === "shared"}
      changed={isChanged(scope, name)}
    />
  );
}

export function SelectSetting<S extends SettingsScope>({
  scope,
  name,
}: {
  scope: S;
  name: SelectFieldName<S>;
}) {
  const { settings, update, isChanged } = useSettingsEditor();
  const text = selectText[scope][name] as {
    label: string;
    hint?: string;
    options: Record<string, string>;
  };
  const values = (selectFields[scope] as Record<string, readonly string[]>)[name];
  return (
    <SelectField
      label={text.label}
      hint={text.hint}
      value={(settings[scope] as Record<string, string>)[name]}
      options={values.map((value) => ({ value, label: text.options[value] }))}
      onChange={(value) =>
        update(scope, { [name]: value } as Partial<AllSettings[S]>)
      }
      shared={scope === "shared"}
      changed={isChanged(scope, name)}
    />
  );
}

export function ChildrenField() {
  const { settings, update, isChanged } = useSettingsEditor();
  const years = settings.shared.childBirthYears;
  const setYears = (childBirthYears: number[]) =>
    update("shared", { childBirthYears });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">Kinder</span>
        <SharedBadge />
        {isChanged("shared", "childBirthYears") && <ChangedBadge />}
      </div>
      {years.length === 0 && (
        <p className="text-xs text-ink-2">Keine Kinder eingetragen.</p>
      )}
      {years.map((year, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">
            <NumberField
              label={`Geburtsjahr Kind ${index + 1}`}
              spec={childBirthYearSpec}
              value={year}
              onChange={(value) =>
                setYears(years.map((y, i) => (i === index ? value : y)))
              }
            />
          </div>
          <button
            type="button"
            onClick={() => setYears(years.filter((_, i) => i !== index))}
            className="mt-6 rounded-md border border-axis px-3 py-2 text-sm text-ink-2 hover:text-ink"
            aria-label={`Kind ${index + 1} entfernen`}
          >
            Entfernen
          </button>
        </div>
      ))}
      {years.length < MAX_CHILDREN && (
        <button
          type="button"
          onClick={() => setYears([...years, childBirthYearSpec.default])}
          className="rounded-md border border-axis px-3 py-2 text-sm font-medium text-ink hover:bg-accent-wash"
        >
          Kind hinzufügen
        </button>
      )}
    </div>
  );
}

/** "= 1.800 € pro Jahr" under the monthly savings rate. */
export function yearlySavingsHint(monthly: number): string {
  return `= ${formatEuro(monthly * 12)} pro Jahr`;
}
