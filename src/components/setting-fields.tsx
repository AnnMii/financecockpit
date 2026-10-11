"use client";

import type { FieldText } from "@/lib/settings/labels";
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
import { useLocale } from "./locale-provider";
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
  info,
}: {
  scope: S;
  name: NumberFieldName<S>;
  /** Overrides for calculators that call a shared value differently. */
  label?: string;
  unit?: string;
  hint?: React.ReactNode;
  slider?: SliderSpec;
  /** Extra element after the label, e.g. an <InfoPopover>. */
  info?: React.ReactNode;
}) {
  const { t } = useLocale();
  const { settings, update, isChanged } = useSettingsEditor();
  const text = (t.numbers[scope] as Record<string, FieldText>)[name];
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
      info={info}
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
  const { t } = useLocale();
  const { settings, update, isChanged } = useSettingsEditor();
  const text = (t.toggles[scope] as Record<string, FieldText>)[name];
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
  const { t } = useLocale();
  const { settings, update, isChanged } = useSettingsEditor();
  const text = (
    t.selects[scope] as Record<
      string,
      FieldText & { options: Record<string, string> }
    >
  )[name];
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
  const { t } = useLocale();
  const { settings, update, isChanged } = useSettingsEditor();
  const years = settings.shared.childBirthYears;
  const setYears = (childBirthYears: number[]) =>
    update("shared", { childBirthYears });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">{t.children.label}</span>
        <SharedBadge />
        {isChanged("shared", "childBirthYears") && <ChangedBadge />}
      </div>
      {years.length === 0 && (
        <p className="text-xs text-ink-2">{t.children.none}</p>
      )}
      {years.map((year, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">
            <NumberField
              label={t.children.birthYear(index + 1)}
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
            aria-label={t.children.removeAria(index + 1)}
          >
            {t.children.remove}
          </button>
        </div>
      ))}
      {years.length < MAX_CHILDREN && (
        <button
          type="button"
          onClick={() => setYears([...years, childBirthYearSpec.default])}
          className="rounded-md border border-axis px-3 py-2 text-sm font-medium text-ink hover:bg-accent-wash"
        >
          {t.children.add}
        </button>
      )}
    </div>
  );
}
