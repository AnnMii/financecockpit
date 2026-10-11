"use client";

import { Assumptions, CalculatorShell } from "@/components/calculator-shell";
import { StackedColumns } from "@/components/charts/stacked-columns";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import {
  NumberSetting,
  SelectSetting,
  ToggleSetting,
} from "@/components/setting-fields";
import { useSettingsEditor } from "@/components/settings-provider";
import { StatTile } from "@/components/stat-tile";
import { useWithdrawalPlan } from "@/components/use-calculators";
import type {
  WithdrawalPlanInput,
  WithdrawalPlanResult,
} from "@/lib/calculators/withdrawal-plan";
import {
  formatEuro,
  formatEuroCents,
  formatEuroCompact,
  formatYears,
} from "@/lib/format";

const SERIES = [{ key: "capital", label: "Kapital", color: "var(--series-1)" }];

const PER_INTERVAL = {
  monthly: "pro Monat",
  quarterly: "pro Quartal",
  biannual: "pro Halbjahr",
  yearly: "pro Jahr",
};

export function WithdrawalPlanCalculator() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

function Workspace() {
  const { input, errors, result } = useWithdrawalPlan();
  const { settings } = useSettingsEditor();
  const { output, interval } = settings["withdrawal-plan"];

  return (
    <CalculatorShell
      scope="withdrawal-plan"
      errors={errors}
      form={
        <>
          <Section title="Berechnung">
            <SelectSetting scope="withdrawal-plan" name="output" />
            <p className="text-xs text-ink-2">
              Das gesuchte Feld entfällt bei den Eingaben und erscheint als
              Ergebnis.
            </p>
          </Section>

          <Section title="Entnahme">
            {output !== "capital" && (
              <NumberSetting scope="withdrawal-plan" name="capitalAssets" />
            )}
            {output !== "amount" && (
              <NumberSetting
                scope="withdrawal-plan"
                name="withdrawalAmount"
                unit={`€ ${PER_INTERVAL[interval]}`}
              />
            )}
            <SelectSetting scope="withdrawal-plan" name="interval" />
            {output !== "period" && (
              <>
                <NumberSetting scope="withdrawal-plan" name="periodYears" />
                <ToggleSetting scope="withdrawal-plan" name="capitalConsumption" />
              </>
            )}
          </Section>

          <Section title="Zinsen">
            <NumberSetting
              scope="shared"
              name="retirementReturn"
              label="Zinssatz p. a."
              hint="Deine Rendite im Ruhestand aus den globalen Werten."
            />
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
  input: WithdrawalPlanInput;
  result: WithdrawalPlanResult;
}) {
  const endless = result.periodYears === null;
  const figures = {
    amount: {
      label: `Entnahmebetrag ${PER_INTERVAL[input.interval]}`,
      value: formatEuroCents(result.amount),
    },
    period: {
      label: "Entnahmezeitraum",
      value: endless ? "endlos" : formatYears(result.periodYears!),
    },
    capital: { label: "Anlagevermögen", value: formatEuro(result.capital) },
  };
  const searched = figures[input.output];
  const others = (Object.keys(figures) as (keyof typeof figures)[]).filter(
    (key) => key !== input.output,
  );
  const keepsCapital = input.output !== "period" && !input.capitalConsumption;

  const tickEvery = result.years.length > 15 ? 5 : 1;
  const chartData = result.years.map((year) => ({
    tick: year.year % tickEvery === 0 ? String(year.year) : "",
    title: `Nach ${formatYears(year.year)}`,
    values: { capital: year.capital },
  }));

  return (
    <>
      <StatTile
        hero
        label={searched.label}
        value={searched.value}
        note={
          endless
            ? "Die Entnahme übersteigt die Zinsen nicht; das Kapital wird nie aufgebraucht."
            : keepsCapital
              ? "Entnommen werden nur die Zinsen; das Kapital bleibt erhalten."
              : undefined
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        {others.map((key) => (
          <StatTile key={key} label={figures[key].label} value={figures[key].value} />
        ))}
        <StatTile
          label="Summe der Entnahmen"
          value={
            result.totalWithdrawn === null ? "–" : formatEuro(result.totalWithdrawn)
          }
          note={
            result.totalWithdrawn === null
              ? undefined
              : `davon ${formatEuro(Math.max(0, result.totalWithdrawn - (keepsCapital ? 0 : result.capital)))} Zinsen`
          }
        />
      </div>

      <Card>
        <h2 className="text-base font-semibold">Kapital pro Jahr</h2>
        <p className="mb-4 text-sm text-ink-2">
          Verbleibendes Anlagevermögen am Ende jedes Jahres
          {endless ? " (die ersten 30 Jahre)" : ""}.
        </p>
        <StackedColumns
          data={chartData}
          series={SERIES}
          formatValue={formatEuro}
          formatAxis={formatEuroCompact}
          ariaLabel="Säulendiagramm: verbleibendes Kapital am Ende jedes Jahres"
        />
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">
            Jahreswerte als Tabelle
          </summary>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 text-left font-medium">Jahr</th>
                  <th className="px-3 py-2 text-right font-medium">Kapital</th>
                </tr>
              </thead>
              <tbody>
                {result.years.map((year) => (
                  <tr key={year.year} className="border-b border-line last:border-0">
                    <td className="px-3 py-1.5 tabular-nums">{year.year}</td>
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
          "Entnahmen erfolgen am Ende jedes Intervalls; der Jahreszins wird auf das Intervall umgerechnet, sodass sich über ein Jahr genau der Zinssatz ergibt.",
          "Steuern und Inflation sind nicht berücksichtigt; trage dafür einen entsprechend niedrigeren Zinssatz ein.",
          "Formeln aus den Ergebnissen des Finanzfluss-Rechners hergeleitet. Keine Steuer- oder Anlageberatung.",
        ]}
      />
    </>
  );
}
