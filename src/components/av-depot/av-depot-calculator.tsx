"use client";

import { DraftBar, DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import {
  AvDepotField,
  ChildrenField,
  SharedField,
  TaxSavingsModeField,
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
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <div>
        <Card className="space-y-7">
          <Section title="Persönliche Daten">
            <SharedField name="age" slider={sliders.age} />
            <SharedField name="retirementAge" hint="Zwischen 65 und 70 Jahren." />
          </Section>

          <Section title="Einkommen">
            <SharedField name="zveSavingsPhase" slider={sliders.income} />
            <SharedField name="zveRetirement" slider={sliders.income} />
          </Section>

          <Section title="Ansparphase">
            <SharedField
              name="savingsRateMonthly"
              slider={sliders.savingsRateMonthly}
              hint={`${yearlySavingsHint(input.savingsRate / 12)}. Gefördert bis 150 € pro Monat, möglich bis 1.140 €.`}
            />
            <SharedField name="expectedReturn" />
          </Section>

          <Section title="Kinder">
            <ChildrenField />
          </Section>

          <Section title="Auszahlphase">
            <AvDepotField name="oneTimePayout" slider={sliders.oneTimePayout} />
            <AvDepotField name="payoutUntilAge" />
            <AvDepotField name="payoutReturnRate" />
          </Section>

          <Section title="Erweitert">
            <AvDepotField name="avDepotCosts" />
            <TaxSavingsModeField />
            <SharedField name="exemptionOrder" />
            <AvDepotField name="baseRate" />
          </Section>
        </Card>
      </div>

      <DraftBar />

      {result ? (
        <AvDepotResults input={input} result={result} />
      ) : (
        <Card>
          <h2 className="mb-2 text-base font-semibold">
            Mit diesen Eingaben kann nicht gerechnet werden
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-critical">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
