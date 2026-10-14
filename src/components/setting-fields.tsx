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
  FieldInfo,
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
  derived,
  scale = 1,
  action,
  warning,
}: {
  scope: S;
  name: NumberFieldName<S>;
  /** Overrides for calculators that call a shared value differently. */
  label?: string;
  unit?: string;
  hint?: React.ReactNode;
  slider?: SliderSpec;
  /** Replaces the explanation of the field, e.g. by a panel with a chart. */
  info?: React.ReactNode;
  /**
   * A value that follows from other inputs. The field then shows it instead
   * of the setting and cannot be edited.
   */
  derived?: number;
  /**
   * The field shows the stored value divided by this and stores what is
   * entered times it, e.g. 12 to enter a yearly amount per month.
   */
  scale?: number;
  /** A small control at the right end of the label row, e.g. a button. */
  action?: React.ReactNode;
  /** Colours the number red and says why below the field. */
  warning?: React.ReactNode;
}) {
  const { t } = useLocale();
  const { settings, update, isChanged } = useSettingsEditor();
  const text = (t.numbers[scope] as Record<string, FieldText>)[name];
  const stored = (numberFields[scope] as Record<string, NumberFieldSpec>)[name];
  const spec = scale === 1 ? stored : { ...stored, max: stored.max / scale };
  // Cents are enough; the division must not show 4.166,6667.
  const shown = (value: number) =>
    scale === 1 ? value : Math.round((value / scale) * 100) / 100;
  return (
    <NumberField
      label={label ?? text.label}
      unit={unit ?? text.unit}
      hint={hint ?? text.hint}
      spec={spec}
      value={shown(derived ?? (settings[scope] as Record<string, number>)[name])}
      onChange={(value) =>
        update(scope, { [name]: value * scale } as Partial<AllSettings[S]>)
      }
      shared={scope === "shared"}
      changed={derived === undefined && isChanged(scope, name)}
      slider={derived === undefined ? slider : undefined}
      readOnly={derived !== undefined}
      action={action}
      warning={warning}
      info={
        info ?? (
          <FieldInfo label={label ?? text.label}>
            {(t.fieldInfo[scope] as Record<string, string>)[name]}
          </FieldInfo>
        )
      }
    />
  );
}

const INCOME_SLIDERS = {
  yearly: { min: 0, max: 130_000, step: 1_000 },
  monthly: { min: 0, max: 10_000, step: 100 },
};

const INCOME_SWITCH = {
  taxableIncomeSavingsPhase: "incomeIntervalSavings",
  taxableIncomeRetirement: "incomeIntervalRetirement",
} as const;

/**
 * An income the tax is calculated from, with the choice of entering it per
 * month (as the pension statement gives it) or per year. The settings hold
 * the yearly amount either way.
 */
export function IncomeSetting({
  name,
  slider = false,
}: {
  name: keyof typeof INCOME_SWITCH;
  slider?: boolean;
}) {
  const { t, f } = useLocale();
  const { settings } = useSettingsEditor();
  const monthly = settings.shared[INCOME_SWITCH[name]] === "monthly";
  const hint = t.numbers.shared[name].hint;
  return (
    <>
      <SelectSetting scope="shared" name={INCOME_SWITCH[name]} />
      <NumberSetting
        scope="shared"
        name={name}
        scale={monthly ? 12 : 1}
        unit={monthly ? t.common.eurosPerMonth : t.common.eurosPerYear}
        slider={slider ? INCOME_SLIDERS[monthly ? "monthly" : "yearly"] : undefined}
        hint={
          monthly
            ? `${hint} ${t.common.perYearEquals(f.euro(settings.shared[name]))}`
            : hint
        }
      />
    </>
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
      info={
        <FieldInfo label={text.label}>
          {(t.fieldInfo[scope] as Record<string, string>)[name]}
        </FieldInfo>
      }
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
      info={
        <FieldInfo label={text.label}>
          {(t.fieldInfo[scope] as Record<string, string>)[name]}
        </FieldInfo>
      }
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
      <div className="relative flex items-center gap-2">
        <span className="text-sm font-medium text-ink">{t.children.label}</span>
        <SharedBadge />
        {isChanged("shared", "childBirthYears") && <ChangedBadge />}
        <FieldInfo label={t.children.label}>{t.children.info}</FieldInfo>
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
