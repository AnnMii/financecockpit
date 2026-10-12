"use client";

import { useState } from "react";
import {
  Assumptions,
  CalculatorShell,
  YearlyTable,
} from "@/components/calculator-shell";
import { WithdrawalChart } from "@/components/charts/calculator-charts";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import {
  NumberSetting,
  SelectSetting,
  ToggleSetting,
} from "@/components/setting-fields";
import { usePlanRecords } from "@/components/plan/plan-records";
import { useSettingsEditor } from "@/components/settings-provider";
import { StatTile } from "@/components/stat-tile";
import { useWithdrawalPlan } from "@/components/use-calculators";
import type {
  WithdrawalInterval,
  WithdrawalPlanInput,
  WithdrawalPlanResult,
} from "@/lib/calculators/withdrawal-plan";
import { toPlanInput } from "@/lib/calculators/registry";
import type { Dictionary } from "@/lib/i18n";
import { calculatePlan, validatePlanInput } from "@/lib/plan/plan";
import { latestSnapshot } from "@/lib/plan/tracking";

/** "pro Monat" / "per month" for a withdrawal interval. */
export function perIntervalText(
  t: Dictionary,
  interval: WithdrawalInterval,
): string {
  return {
    monthly: t.common.perMonth,
    quarterly: t.common.perQuarter,
    biannual: t.common.perHalfYear,
    yearly: t.common.perYear,
  }[interval];
}

export function WithdrawalPlanCalculator() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

/**
 * Small button that copies what the overall plan has at retirement into the
 * calculator: the free assets (ETF-Depot and Tagesgeld) and the payout
 * period. The copy is made once; the calculator stays independent of the
 * plan afterwards.
 */
function FromPlanButton({
  onTakenOver,
}: {
  onTakenOver: (capital: number, message: string) => void;
}) {
  const { t, f } = useLocale();
  const text = t.withdrawal.fromPlan;
  const { settings, update } = useSettingsEditor();
  const { snapshots } = usePlanRecords();

  const input = toPlanInput(settings, latestSnapshot(snapshots)?.values);
  const possible = validatePlanInput(input).length === 0;

  const takeOver = () => {
    // In today's money, like the plan; the calculator is switched to match.
    const capital = Math.round(calculatePlan(input).typical.freeCapital);
    const period = Math.min(
      100,
      Math.max(1, input.payoutUntilAge - input.retirementAge),
    );
    update("withdrawal-plan", {
      output: "amount",
      capitalAssets: capital,
      periodYears: period,
      considerTax: true,
      realTerms: true,
    });
    onTakenOver(capital, text.done(f.euro(capital), f.years(period)));
  };

  return (
    <button
      type="button"
      disabled={!possible}
      onClick={takeOver}
      title={possible ? text.hint : text.unavailable}
      className="rounded-md border border-axis px-2 py-0.5 text-xs font-medium text-ink hover:bg-accent-wash disabled:opacity-50"
    >
      {text.button}
    </button>
  );
}

function Workspace() {
  const { t, f } = useLocale();
  const text = t.withdrawal;
  const { input, errors, result } = useWithdrawalPlan();
  const { settings } = useSettingsEditor();
  const { output, interval, considerTax, realTerms, capitalAssets } =
    settings["withdrawal-plan"];
  // What the button took over, shown under the field while it still applies.
  const [taken, setTaken] = useState<{ capital: number; message: string } | null>(
    null,
  );

  return (
    <CalculatorShell
      scope="withdrawal-plan"
      errors={errors}
      form={
        <>
          <Section title={text.sections.calculation}>
            <SelectSetting scope="withdrawal-plan" name="output" />
            <p className="text-xs text-ink-2">{text.searchedFieldHint}</p>
          </Section>

          <Section title={text.sections.withdrawal}>
            {output !== "capital" && (
              <NumberSetting
                scope="withdrawal-plan"
                name="capitalAssets"
                hint={taken?.capital === capitalAssets ? taken.message : undefined}
                action={
                  <FromPlanButton
                    onTakenOver={(capital, message) => setTaken({ capital, message })}
                  />
                }
              />
            )}
            {output !== "amount" && (
              <NumberSetting
                scope="withdrawal-plan"
                name="withdrawalAmount"
                unit={`€ ${perIntervalText(t, interval)}`}
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

          <Section title={text.sections.interest}>
            <NumberSetting
              scope="shared"
              name="retirementReturn"
              label={text.interestRate}
              hint={
                considerTax || realTerms
                  ? text.interestAdjusted(
                      f.percent(input.interestRate),
                      realTerms,
                      considerTax,
                    )
                  : text.interestRateHint
              }
            />
            <ToggleSetting scope="withdrawal-plan" name="considerTax" />
            <ToggleSetting scope="withdrawal-plan" name="realTerms" />
            {realTerms && <NumberSetting scope="shared" name="inflationRate" />}
          </Section>
        </>
      }
    >
      {result && (
        <>
          {realTerms && <p className="text-sm text-ink-2">{text.realNote}</p>}
          <Results input={input} result={result} />
        </>
      )}
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
  const { t, f } = useLocale();
  const text = t.withdrawal;
  const endless = result.periodYears === null;
  const figures = {
    amount: {
      label: text.amount(perIntervalText(t, input.interval)),
      value: f.euroCents(result.amount),
    },
    period: {
      label: text.period,
      value: endless ? t.common.endless : f.years(result.periodYears!),
    },
    capital: { label: text.capital, value: f.euro(result.capital) },
  };
  const searched = figures[input.output];
  const others = (Object.keys(figures) as (keyof typeof figures)[]).filter(
    (key) => key !== input.output,
  );
  const keepsCapital = input.output !== "period" && !input.capitalConsumption;

  return (
    <>
      <StatTile
        hero
        label={searched.label}
        value={searched.value}
        note={
          endless
            ? text.endlessNote
            : keepsCapital
              ? text.keepsCapitalNote
              : undefined
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        {others.map((key) => (
          <StatTile key={key} label={figures[key].label} value={figures[key].value} />
        ))}
        <StatTile
          label={text.totalWithdrawn}
          value={
            result.totalWithdrawn === null ? "–" : f.euro(result.totalWithdrawn)
          }
          note={
            result.totalWithdrawn === null
              ? undefined
              : text.ofWhichInterest(
                  f.euro(
                    Math.max(
                      0,
                      result.totalWithdrawn - (keepsCapital ? 0 : result.capital),
                    ),
                  ),
                )
          }
        />
      </div>

      <Card>
        <h2 className="text-base font-semibold">{text.chartTitle}</h2>
        <p className="mb-4 text-sm text-ink-2">
          {text.chartSubtitle}
          {endless ? text.chartSubtitleEndless : ""}.
        </p>
        <WithdrawalChart result={result} />
        <YearlyTable
          head={[t.common.year, t.common.capital]}
          rows={result.years.map((year) => [year.year, f.euro(year.capital)])}
        />
      </Card>

      <Assumptions items={text.assumptions} />
    </>
  );
}
