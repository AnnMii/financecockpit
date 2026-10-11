"use client";

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
import { useSettingsEditor } from "@/components/settings-provider";
import { StatTile } from "@/components/stat-tile";
import { useWithdrawalPlan } from "@/components/use-calculators";
import type {
  WithdrawalInterval,
  WithdrawalPlanInput,
  WithdrawalPlanResult,
} from "@/lib/calculators/withdrawal-plan";
import type { Dictionary } from "@/lib/i18n";

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

function Workspace() {
  const { t } = useLocale();
  const text = t.withdrawal;
  const { input, errors, result } = useWithdrawalPlan();
  const { settings } = useSettingsEditor();
  const { output, interval } = settings["withdrawal-plan"];

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
              <NumberSetting scope="withdrawal-plan" name="capitalAssets" />
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
              hint={text.interestRateHint}
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
