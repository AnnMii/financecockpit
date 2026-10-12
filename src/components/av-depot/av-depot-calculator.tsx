"use client";

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

// Slider ranges follow the Finanzfluss calculator; the inputs accept more.
const sliders = {
  age: { min: 18, max: 66, step: 1 },
  // 120 € to 6.840 € per year, the limit of a single contract
  savingsRateMonthly: { min: 10, max: 570, step: 5 },
  oneTimePayout: { min: 0, max: 30, step: 1 },
};

export function AvDepotCalculator() {
  return (
    <DraftSettings>
      <AvDepotWorkspace />
    </DraftSettings>
  );
}

function AvDepotWorkspace() {
  const { t, f } = useLocale();
  const { input, errors, result } = useAvDepot();
  const { settings } = useSettingsEditor();
  const text = t.avDepot;
  const capped = settings.shared.savingsRateMonthly > AV_DEPOT_MAX_MONTHLY;

  return (
    <CalculatorShell
      scope="av-depot"
      errors={errors}
      form={
        <>
          <Section title={text.sections.personal}>
            <NumberSetting scope="shared" name="age" slider={sliders.age} />
            <NumberSetting
              scope="shared"
              name="retirementAge"
              hint={text.retirementAgeHint}
            />
          </Section>

          <Section title={text.sections.income}>
            <IncomeSetting name="zveSavingsPhase" slider />
            <IncomeSetting name="zveRetirement" slider />
          </Section>

          <Section title={text.sections.saving}>
            <NumberSetting
              scope="shared"
              name="savingsRateMonthly"
              slider={sliders.savingsRateMonthly}
              hint={
                capped
                  ? text.savingsRateCapped(f.euro(AV_DEPOT_MAX_MONTHLY))
                  : text.savingsRateHint(
                      t.common.perYearEquals(f.euro(input.savingsRate)),
                    )
              }
            />
            <NumberSetting scope="shared" name="expectedReturn" />
          </Section>

          <Section title={text.sections.children}>
            <ChildrenField />
          </Section>

          <Section title={text.sections.payout}>
            <NumberSetting
              scope="av-depot"
              name="oneTimePayout"
              slider={sliders.oneTimePayout}
            />
            <NumberSetting
              scope="shared"
              name="payoutUntilAge"
              hint={text.payoutUntilHint}
            />
            <NumberSetting scope="shared" name="retirementReturn" />
          </Section>

          <Section title={text.sections.advanced}>
            <NumberSetting scope="av-depot" name="avDepotCosts" />
            <SelectSetting scope="av-depot" name="taxSavingsMode" />
            <NumberSetting scope="shared" name="exemptionOrder" />
            <NumberSetting scope="av-depot" name="baseRate" />
          </Section>
        </>
      }
    >
      {result && <AvDepotResults input={input} result={result} />}
    </CalculatorShell>
  );
}
