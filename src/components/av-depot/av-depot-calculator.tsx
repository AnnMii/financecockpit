"use client";

import { useState } from "react";
import { BudgetHint, RestButton } from "@/components/budget";
import { CalculatorShell } from "@/components/calculator-shell";
import { DraftSettings } from "@/components/draft-settings";
import { Section } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import {
  ChildrenField,
  IncomeSetting,
  NumberSetting,
  SelectSetting,
} from "@/components/setting-fields";
import { useSettingsEditor } from "@/components/settings-provider";
import { AV_DEPOT_MAX_MONTHLY } from "@/lib/calculators/registry";
import { AvDepotResults } from "./av-depot-results";
import { useAvDepot } from "./use-av-depot";

// The sliders of the Finanzfluss calculator, with their ranges and steps; the
// inputs accept more. The savings rate is yearly there (120 € to 6.840 €, the
// limit of a single contract) and monthly here.
const sliders = {
  age: { min: 18, max: 66, step: 1 },
  retirementAge: { min: 65, max: 70, step: 1 },
  savingsRateMonthly: { min: 10, max: 570, step: 1 },
  expectedReturn: { min: 0, max: 20, step: 0.1 },
  avDepotCosts: { min: 0, max: 5, step: 0.1 },
  exemptionOrder: { min: 0, max: 1_000, step: 10 },
  baseRate: { min: 0, max: 10, step: 0.01 },
  oneTimePayout: { min: 0, max: 30, step: 1 },
  payoutUntilAge: { min: 85, max: 120, step: 1 },
  retirementReturn: { min: 0, max: 20, step: 0.1 },
};

export function AvDepotCalculator() {
  return (
    <DraftSettings>
      <AvDepotWorkspace />
    </DraftSettings>
  );
}

/** Minimum, subsidy limit and maximum of the savings rate, as at Finanzfluss. */
function SavingsPresets() {
  const { t, f } = useLocale();
  const { settings, update } = useSettingsEditor();
  const current = settings["av-depot"].savingsRateMonthly;
  // 120 €, 1.800 € and 13.680 € per year
  const presets = [
    { value: 10, label: t.avDepot.presets.minimum },
    { value: 150, label: t.avDepot.presets.subsidyLimit },
    { value: AV_DEPOT_MAX_MONTHLY, label: t.avDepot.presets.maximum },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          aria-pressed={current === preset.value}
          onClick={() => update("av-depot", { savingsRateMonthly: preset.value })}
          className={`rounded-md border px-2 py-1.5 text-center ${
            current === preset.value
              ? "border-accent bg-accent-wash"
              : "border-axis hover:bg-accent-wash"
          }`}
        >
          <span className="block text-sm font-medium text-ink">
            {f.euro(preset.value)}
          </span>
          <span className="block text-xs text-ink-2">{preset.label}</span>
        </button>
      ))}
    </div>
  );
}

function AvDepotWorkspace() {
  const { t, f } = useLocale();
  const { input, errors, result } = useAvDepot();
  const text = t.avDepot;

  // The advanced inputs start hidden to keep the calculator simple. With an
  // error they are shown anyway: it may be one of them that has to change.
  const [advanced, setAdvanced] = useState(false);
  const forced = errors.length > 0;
  const showAdvanced = advanced || forced;

  return (
    <CalculatorShell
      scope="av-depot"
      errors={errors}
      form={
        <>
          <div>
            <label className="flex items-center justify-between gap-3 text-sm font-medium text-ink">
              {text.advancedToggle}
              <input
                type="checkbox"
                checked={showAdvanced}
                disabled={forced}
                onChange={(event) => setAdvanced(event.target.checked)}
                className="size-4 accent-(--accent)"
              />
            </label>
            {forced && (
              <p className="mt-1 text-xs text-ink-2">{text.advancedForced}</p>
            )}
          </div>

          <Section title={text.sections.personal}>
            <NumberSetting scope="shared" name="age" slider={sliders.age} />
            {showAdvanced && (
              <NumberSetting
                scope="shared"
                name="retirementAge"
                slider={sliders.retirementAge}
                hint={text.retirementAgeHint}
              />
            )}
          </Section>

          <Section title={text.sections.income}>
            <IncomeSetting name="zveSavingsPhase" slider />
            <IncomeSetting name="zveRetirement" slider />
          </Section>

          <Section title={text.sections.saving}>
            <SavingsPresets />
            <NumberSetting
              scope="av-depot"
              name="savingsRateMonthly"
              slider={sliders.savingsRateMonthly}
              hint={
                <>
                  {text.savingsRateHint(
                    t.common.perYearEquals(f.euro(input.savingsRate)),
                  )}{" "}
                  <BudgetHint />
                </>
              }
              action={<RestButton part="av" />}
            />
            {showAdvanced && (
              <>
                <NumberSetting
                  scope="shared"
                  name="expectedReturn"
                  slider={sliders.expectedReturn}
                />
                <NumberSetting
                  scope="av-depot"
                  name="avDepotCosts"
                  slider={sliders.avDepotCosts}
                />
                <NumberSetting
                  scope="shared"
                  name="exemptionOrder"
                  slider={sliders.exemptionOrder}
                />
                <SelectSetting scope="av-depot" name="taxSavingsMode" />
                <NumberSetting
                  scope="av-depot"
                  name="baseRate"
                  slider={sliders.baseRate}
                />
              </>
            )}
          </Section>

          <Section title={text.sections.payout}>
            <NumberSetting
              scope="av-depot"
              name="oneTimePayout"
              slider={sliders.oneTimePayout}
            />
            {showAdvanced && (
              <>
                <NumberSetting
                  scope="shared"
                  name="payoutUntilAge"
                  slider={sliders.payoutUntilAge}
                  hint={text.payoutUntilHint}
                />
                <NumberSetting
                  scope="shared"
                  name="retirementReturn"
                  slider={sliders.retirementReturn}
                />
              </>
            )}
          </Section>

          <Section title={text.sections.children}>
            <ChildrenField />
          </Section>
        </>
      }
    >
      {result && <AvDepotResults input={input} result={result} />}
    </CalculatorShell>
  );
}
