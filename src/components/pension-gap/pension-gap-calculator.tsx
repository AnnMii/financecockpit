"use client";

import { Assumptions, CalculatorShell } from "@/components/calculator-shell";
import { ShareBar } from "@/components/charts/share-bar";
import { StackedColumns } from "@/components/charts/stacked-columns";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import { NumberSetting, ToggleSetting } from "@/components/setting-fields";
import { StatTile } from "@/components/stat-tile";
import { usePensionGap } from "@/components/use-calculators";
import type {
  GapClosing,
  PensionGapInput,
  PensionGapResult,
} from "@/lib/calculators/pension-gap";
import {
  formatEuro,
  formatEuroCents,
  formatEuroCompact,
  formatYears,
} from "@/lib/format";

const sliders = {
  age: { min: 18, max: 66, step: 1 },
  pension: { min: 0, max: 4_000, step: 50 },
  desiredPension: { min: 0, max: 6_000, step: 50 },
};

const SERIES = [
  { key: "saving", label: "Ansparen", color: "var(--series-1)" },
  { key: "payout", label: "Entnahme", color: "var(--series-3)" },
];

export function PensionGapCalculator() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

function Workspace() {
  const { input, errors, result } = usePensionGap();

  return (
    <CalculatorShell
      scope="pension-gap"
      errors={errors}
      form={
        <>
          <Section title="Rentenansprüche pro Monat">
            <NumberSetting scope="pension-gap" name="statePension" slider={sliders.pension} />
            <NumberSetting scope="pension-gap" name="companyPension" />
            <NumberSetting scope="pension-gap" name="privatePension" />
            <NumberSetting scope="pension-gap" name="riesterPension" />
          </Section>

          <Section title="Steuern auf die Rente">
            <NumberSetting scope="pension-gap" name="taxPrediction" />
            <NumberSetting scope="pension-gap" name="yearlyTaxFreeAmount" />
          </Section>

          <Section title="Wunschrente">
            <NumberSetting
              scope="pension-gap"
              name="desiredPension"
              slider={sliders.desiredPension}
            />
          </Section>

          <Section title="Ruhestand">
            <NumberSetting scope="shared" name="retirementAge" />
            <NumberSetting scope="shared" name="payoutUntilAge" />
            <NumberSetting scope="shared" name="retirementReturn" />
          </Section>

          <Section title="Sparphase">
            <NumberSetting scope="shared" name="age" slider={sliders.age} />
            <NumberSetting scope="shared" name="currentCapital" />
            <NumberSetting
              scope="shared"
              name="expectedReturn"
              label="Rendite bis zur Rente"
              hint="Vor Steuern; die Kapitalertragsteuer wird abgezogen."
            />
            <NumberSetting scope="shared" name="capitalGainsTax" />
          </Section>

          <Section title="Inflation">
            <ToggleSetting scope="shared" name="considerInflation" />
            <NumberSetting scope="shared" name="inflationRate" />
          </Section>
        </>
      }
    >
      {result && <Results input={input} result={result} />}
    </CalculatorShell>
  );
}

function ClosingCard({
  title,
  description,
  closing,
  years,
}: {
  title: string;
  description: string;
  closing: GapClosing | null;
  years: number;
}) {
  return (
    <Card>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-ink-2">{description}</p>
      {closing ? (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-ink-2">Kapital bei Renteneintritt</dt>
            <dd className="text-2xl font-semibold">{formatEuro(closing.capital)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">Sparrate pro Monat</dt>
            <dd className="text-2xl font-semibold">
              {formatEuroCents(closing.savingsRate)}
            </dd>
            <dd className="text-xs text-ink-2">über {formatYears(years)}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-ink">
          Nicht möglich: Nach Steuern und Inflation bleibt im Ruhestand keine
          Rendite, von der sich leben ließe.
        </p>
      )}
    </Card>
  );
}

function Results({
  input,
  result,
}: {
  input: PensionGapInput;
  result: PensionGapResult;
}) {
  const chartData = result.years.map((year) => ({
    tick: year.age % 5 === 0 ? String(year.age) : "",
    title: `Alter ${year.age}`,
    values: { [year.phase]: year.capital },
  }));

  return (
    <>
      <StatTile
        hero
        label="Rentenlücke pro Monat"
        value={formatEuro(result.gap)}
        note={
          result.gap === 0
            ? "Deine erwartete Nettorente deckt die Wunschrente."
            : `So viel fehlt zwischen ${formatEuro(result.netPension)} Nettorente und ${formatEuro(input.desiredPension)} Wunschrente.`
        }
      />

      <Card>
        <h2 className="mb-4 text-base font-semibold">Wunschrente im Überblick</h2>
        <ShareBar
          ariaLabel="Zusammensetzung der Wunschrente"
          formatValue={formatEuro}
          shares={[
            {
              label: "Nettorente",
              value: Math.min(result.netPension, input.desiredPension),
              color: "var(--series-1)",
            },
            { label: "Rentenlücke", value: result.gap },
          ]}
        />
        <p className="mt-3 text-xs text-ink-2">
          Bruttorente {formatEuro(result.grossPension)}, davon{" "}
          {formatEuro(result.grossPension - result.netPension)} Steuern pro Monat.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ClosingCard
          title="Mit Kapitalverzehr"
          description={`Das Vermögen ist mit ${input.payoutUntilAge} Jahren aufgebraucht.`}
          closing={result.withConsumption}
          years={result.yearsUntilRetirement}
        />
        <ClosingCard
          title="Ohne Kapitalverzehr"
          description="Du lebst nur von den Erträgen, das Vermögen bleibt erhalten."
          closing={result.withoutConsumption}
          years={result.yearsUntilRetirement}
        />
      </div>

      <Card>
        <h2 className="text-base font-semibold">Vermögensverlauf mit Kapitalverzehr</h2>
        <p className="mb-4 text-sm text-ink-2">
          Stand am Ende jedes Lebensjahres: Ansparen bis {input.retirementAge},
          danach monatliche Entnahme der Rentenlücke.
        </p>
        <StackedColumns
          data={chartData}
          series={SERIES}
          phases
          formatValue={formatEuro}
          formatAxis={formatEuroCompact}
          ariaLabel="Säulendiagramm: Vermögen pro Lebensjahr, erst Ansparen, dann Entnahme"
        />
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">
            Jahreswerte als Tabelle
          </summary>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-medium">Alter</th>
                  <th className="px-3 py-2 text-left font-medium">Phase</th>
                  <th className="px-3 py-2 text-right font-medium">Vermögen</th>
                </tr>
              </thead>
              <tbody>
                {result.years.map((year) => (
                  <tr key={year.age} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5 tabular-nums">{year.age}</td>
                    <td className="px-3 py-1.5 text-ink-2">
                      {year.phase === "saving" ? "Ansparen" : "Entnahme"}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatEuro(year.capital)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>

      <Assumptions
        items={[
          "Der Steuerabzug gilt für die Rente oberhalb des Grundfreibetrags und für die Erträge im Ruhestand; die Kapitalertragsteuer mindert die Rendite bis zur Rente.",
          "Mit Inflation wird mit Renditen nach Abzug der Inflationsrate gerechnet; Rente und Wunschrente bleiben in heutiger Kaufkraft.",
          "Sparraten fließen am Monatsende, Entnahmen am Monatsanfang; Zinsen monatlich.",
          "Kranken- und Pflegeversicherung auf die Rente sind nicht berücksichtigt.",
          "Formeln aus den Ergebnissen des Finanzfluss-Rechners hergeleitet. Keine Steuer- oder Anlageberatung.",
        ]}
      />
    </>
  );
}
