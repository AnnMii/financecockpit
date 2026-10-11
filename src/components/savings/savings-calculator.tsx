"use client";

import { Assumptions, CalculatorShell } from "@/components/calculator-shell";
import { StackedColumns } from "@/components/charts/stacked-columns";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import {
  NumberSetting,
  SelectSetting,
  ToggleSetting,
  yearlySavingsHint,
} from "@/components/setting-fields";
import { useSettingsEditor } from "@/components/settings-provider";
import { StatTile } from "@/components/stat-tile";
import { useSavings } from "@/components/use-calculators";
import type { SavingsInput, SavingsResult } from "@/lib/calculators/savings";
import {
  formatEuro,
  formatEuroCents,
  formatEuroCompact,
  formatPercent,
  formatYears,
} from "@/lib/format";

const SERIES = [
  { key: "deposits", label: "Einzahlungen", color: "var(--series-1)" },
  { key: "interest", label: "Zinsen", color: "var(--series-3)" },
];

export function SavingsCalculator() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

function Workspace() {
  const { input, errors, result } = useSavings();
  const { settings } = useSettingsEditor();
  const { output, considerTax, considerPartialExemption, saveInterval } =
    settings.savings;
  const monthlyRate = settings.shared.savingsRateMonthly;

  return (
    <CalculatorShell
      scope="savings"
      errors={errors}
      form={
        <>
          <Section title="Berechnung">
            <SelectSetting scope="savings" name="output" />
            <p className="text-xs text-ink-2">
              Das gesuchte Feld entfällt bei den Eingaben und erscheint als
              Ergebnis.
            </p>
          </Section>

          <Section title="Sparplan">
            {output !== "startValue" && (
              <NumberSetting
                scope="shared"
                name="currentCapital"
                label="Anfangskapital"
                hint="Dein vorhandenes Kapital aus den globalen Werten."
              />
            )}
            {output !== "savingRate" && (
              <NumberSetting
                scope="shared"
                name="savingsRateMonthly"
                hint={
                  saveInterval === "yearly"
                    ? `${yearlySavingsHint(monthlyRate)}, einmal jährlich eingezahlt.`
                    : yearlySavingsHint(monthlyRate)
                }
              />
            )}
            <SelectSetting scope="savings" name="saveInterval" />
            {output !== "duration" && (
              <NumberSetting scope="savings" name="durationYears" />
            )}
            {output !== "endValue" && (
              <NumberSetting scope="savings" name="endValue" />
            )}
          </Section>

          <Section title="Zinsen">
            {output !== "yearlyInterest" && (
              <NumberSetting
                scope="shared"
                name="expectedReturn"
                label="Zinssatz p. a."
                hint="Deine erwartete Rendite aus den globalen Werten."
              />
            )}
            <SelectSetting scope="savings" name="interestInterval" />
          </Section>

          <Section title="Steuern">
            <ToggleSetting scope="savings" name="considerTax" />
            {considerTax && (
              <>
                <NumberSetting scope="shared" name="capitalGainsTax" />
                <SelectSetting scope="savings" name="distributionType" />
                <ToggleSetting scope="savings" name="considerPartialExemption" />
                {considerPartialExemption && (
                  <NumberSetting scope="savings" name="partialExemption" />
                )}
              </>
            )}
          </Section>
        </>
      }
    >
      {result && <Results input={input} result={result} />}
    </CalculatorShell>
  );
}

function Results({
  input,
  result,
}: {
  input: SavingsInput;
  result: SavingsResult;
}) {
  const perInterval = input.saveInterval === "monthly" ? "pro Monat" : "pro Jahr";
  const figures = {
    endValue: { label: "Endkapital", value: formatEuro(result.endValue) },
    startValue: { label: "Anfangskapital", value: formatEuro(result.startValue) },
    yearlyInterest: {
      label: "Zinssatz p. a.",
      value: formatPercent(result.yearlyInterest),
    },
    duration: { label: "Laufzeit", value: formatYears(result.durationYears) },
    savingRate: {
      label: `Sparrate ${perInterval}`,
      value: formatEuroCents(result.savingRate),
    },
  };
  const searched = figures[input.output];
  const others = (Object.keys(figures) as (keyof typeof figures)[]).filter(
    (key) => key !== input.output,
  );

  const tickEvery = result.years.length > 15 ? 5 : 1;
  const chartData = result.years.map((year) => ({
    tick: year.year % tickEvery === 0 ? String(year.year) : "",
    title: `Nach ${formatYears(Math.min(year.year, result.durationYears))}`,
    values: { deposits: year.deposits, interest: year.interest },
  }));

  return (
    <>
      <StatTile
        hero
        label={searched.label}
        value={searched.value}
        note={
          input.output === "duration"
            ? `Das sind ${Math.ceil(result.durationYears * 12)} Monate.`
            : undefined
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((key) => (
          <StatTile key={key} label={figures[key].label} value={figures[key].value} />
        ))}
      </div>

      <Card>
        <h2 className="text-base font-semibold">Kapital pro Jahr</h2>
        <p className="mb-4 text-sm text-ink-2">
          Einzahlungen inklusive Anfangskapital und die darauf aufgelaufenen
          Zinsen{input.considerTax ? " nach Steuern" : ""}.
        </p>
        <StackedColumns
          data={chartData}
          series={SERIES}
          totalLabel="Kapital"
          formatValue={formatEuro}
          formatAxis={formatEuroCompact}
          ariaLabel="Säulendiagramm: Kapital pro Jahr, aufgeteilt in Einzahlungen und Zinsen"
        />
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-2">Einzahlungen gesamt</dt>
            <dd className="font-semibold tabular-nums">{formatEuro(result.deposits)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">
              Zinsen{input.considerTax ? " nach Steuern" : ""}
            </dt>
            <dd className="font-semibold tabular-nums">{formatEuro(result.interest)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">Endkapital</dt>
            <dd className="font-semibold tabular-nums">{formatEuro(result.endValue)}</dd>
          </div>
        </dl>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">
            Jahreswerte als Tabelle
          </summary>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-medium">Jahr</th>
                  <th className="px-3 py-2 text-right font-medium">Einzahlungen</th>
                  <th className="px-3 py-2 text-right font-medium">Zinsen</th>
                  <th className="px-3 py-2 text-right font-medium">Kapital</th>
                </tr>
              </thead>
              <tbody>
                {result.years.map((year) => (
                  <tr key={year.year} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5 tabular-nums">{year.year}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatEuro(year.deposits)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatEuro(year.interest)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatEuro(year.deposits + year.interest)}
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
          "Einzahlungen erfolgen zu Beginn des Sparintervalls; Zinsen werden im gewählten Zinsintervall gutgeschrieben und mitverzinst.",
          "Ausschüttend: Die Steuer mindert die Zinsen laufend. Thesaurierend: Die Steuer auf den gesamten Gewinn fällt am Ende an.",
          "Die Teilfreistellung stellt den gewählten Anteil der Erträge steuerfrei; ein Sparerpauschbetrag ist nicht berücksichtigt.",
          "Rechenweg nach dem Finanzfluss-Sparrechner. Keine Steuer- oder Anlageberatung.",
        ]}
      />
    </>
  );
}
