"use client";

import { CalculatorShell } from "@/components/calculator-shell";
import { DraftSettings } from "@/components/draft-settings";
import { Section } from "@/components/fields";
import {
  ChildrenField,
  NumberSetting,
  SelectSetting,
  yearlySavingsHint,
} from "@/components/setting-fields";
import { AvDepotResults } from "./av-depot-results";
import { useAvDepot } from "./use-av-depot";

// Slider ranges follow the Finanzfluss calculator; the inputs accept more.
const sliders = {
  age: { min: 18, max: 66, step: 1 },
  income: { min: 0, max: 130_000, step: 1_000 },
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
  const { input, errors, result } = useAvDepot();

  return (
    <CalculatorShell
      scope="av-depot"
      errors={errors}
      form={
        <>
          <Section title="Persönliche Daten">
            <NumberSetting scope="shared" name="age" slider={sliders.age} />
            <NumberSetting scope="shared" name="retirementAge" hint="Zwischen 65 und 70 Jahren." />
          </Section>

          <Section title="Einkommen">
            <NumberSetting scope="shared" name="zveSavingsPhase" slider={sliders.income} />
            <NumberSetting scope="shared" name="zveRetirement" slider={sliders.income} />
          </Section>

          <Section title="Ansparphase">
            <NumberSetting
              scope="shared"
              name="savingsRateMonthly"
              slider={sliders.savingsRateMonthly}
              hint={`${yearlySavingsHint(input.savingsRate / 12)}. Gefördert bis 150 € pro Monat, möglich bis 1.140 €.`}
            />
            <NumberSetting scope="shared" name="expectedReturn" />
          </Section>

          <Section title="Kinder">
            <ChildrenField />
          </Section>

          <Section title="Auszahlphase">
            <NumberSetting scope="av-depot" name="oneTimePayout" slider={sliders.oneTimePayout} />
            <NumberSetting
              scope="shared"
              name="payoutUntilAge"
              hint="Im Altersvorsorgedepot mindestens bis 85."
            />
            <NumberSetting scope="shared" name="retirementReturn" />
          </Section>

          <Section title="Erweitert">
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
