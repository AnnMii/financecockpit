"use client";

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

export function AvDepotCalculator() {
  const { input, errors, result } = useAvDepot();

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="space-y-7">
        <Section title="Persönliche Daten">
          <SharedField name="age" />
          <SharedField name="retirementAge" hint="Zwischen 65 und 70 Jahren." />
        </Section>

        <Section title="Einkommen">
          <SharedField name="zveSavingsPhase" />
          <SharedField name="zveRetirement" />
        </Section>

        <Section title="Ansparphase">
          <SharedField
            name="savingsRateMonthly"
            hint={`${yearlySavingsHint(input.savingsRate / 12)}. Gefördert bis 150 € pro Monat, möglich bis 1.140 €.`}
          />
          <SharedField name="expectedReturn" />
        </Section>

        <Section title="Kinder">
          <ChildrenField />
        </Section>

        <Section title="Auszahlphase">
          <AvDepotField name="oneTimePayout" />
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
