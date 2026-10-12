"use client";

import { BudgetHint, RestButton } from "@/components/budget";
import {
  Assumptions,
  CalculatorShell,
  YearlyTable,
} from "@/components/calculator-shell";
import { SavingsChart } from "@/components/charts/calculator-charts";
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
import { useSavings } from "@/components/use-calculators";
import {
  type SavingsInput,
  type SavingsResult,
  minimumEndValue,
} from "@/lib/calculators/savings";

export function SavingsCalculator() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

function Workspace() {
  const { t, f } = useLocale();
  const text = t.savings;
  const { input, errors, result } = useSavings();
  const { settings } = useSettingsEditor();
  const {
    output,
    untilRetirement,
    considerTax,
    considerPartialExemption,
    saveInterval,
  } = settings.savings;
  const { age, retirementAge } = settings.shared;
  // Targets at or below this are already reached without the searched figure.
  const minimum = minimumEndValue(input);
  const perYear = t.common.perYearEquals(
    f.euro(settings.savings.savingsRateMonthly * 12),
  );

  return (
    <CalculatorShell
      scope="savings"
      errors={errors}
      form={
        <>
          <Section title={text.sections.calculation}>
            <SelectSetting scope="savings" name="output" />
            <p className="text-xs text-ink-2">{text.searchedFieldHint}</p>
          </Section>

          <Section title={text.sections.plan}>
            {output !== "startValue" && (
              <NumberSetting
                scope="shared"
                name="currentCapital"
                label={text.startValue}
                hint={text.startValueHint}
              />
            )}
            {output !== "savingRate" && (
              <NumberSetting
                scope="savings"
                name="savingsRateMonthly"
                hint={
                  <>
                    {saveInterval === "yearly"
                      ? text.yearlyDepositHint(perYear)
                      : perYear}{" "}
                    <BudgetHint />
                  </>
                }
                action={<RestButton part="depot" />}
              />
            )}
            <SelectSetting scope="savings" name="saveInterval" />
            {output !== "duration" && (
              <>
                <ToggleSetting scope="savings" name="untilRetirement" />
                <NumberSetting
                  scope="savings"
                  name="durationYears"
                  derived={untilRetirement ? retirementAge - age : undefined}
                  hint={
                    untilRetirement
                      ? text.durationUntilRetirement(retirementAge, age)
                      : undefined
                  }
                />
              </>
            )}
            {output !== "endValue" && (
              <NumberSetting
                scope="savings"
                name="endValue"
                hint={
                  minimum !== null && minimum > 0
                    ? text.endValueMinimum[output](f.euro(minimum))
                    : undefined
                }
              />
            )}
          </Section>

          <Section title={text.sections.interest}>
            {output !== "yearlyInterest" && (
              <NumberSetting
                scope="shared"
                name="expectedReturn"
                label={text.interestRate}
                hint={text.interestRateHint}
              />
            )}
            <SelectSetting scope="savings" name="interestInterval" />
          </Section>

          <Section title={text.sections.tax}>
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
  const { t, f } = useLocale();
  const text = t.savings;
  const perInterval =
    input.saveInterval === "monthly" ? t.common.perMonth : t.common.perYear;
  const afterTax = input.considerTax ? text.afterTax : "";

  const figures = {
    endValue: { label: t.common.endValue, value: f.euro(result.endValue) },
    startValue: { label: text.startValue, value: f.euro(result.startValue) },
    yearlyInterest: {
      label: text.interestRate,
      value: f.percent(result.yearlyInterest),
    },
    duration: { label: text.duration, value: f.years(result.durationYears) },
    savingRate: {
      label: text.savingRate(perInterval),
      value: f.euroCents(result.savingRate),
    },
  };
  const searched = figures[input.output];
  const others = (Object.keys(figures) as (keyof typeof figures)[]).filter(
    (key) => key !== input.output,
  );

  const totals: [string, number][] = [
    [text.totalDeposits, result.deposits],
    [`${t.common.interest}${afterTax}`, result.interest],
    [t.common.endValue, result.endValue],
  ];

  return (
    <>
      <StatTile
        hero
        label={searched.label}
        value={searched.value}
        note={
          result.alreadyReached && input.output !== "endValue"
            ? text.alreadyReached[input.output](
                f.euro(input.endValue),
                f.euro(result.endValue),
              )
            : input.output === "duration"
              ? text.durationMonths(Math.ceil(result.durationYears * 12))
              : undefined
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {others.map((key) => (
          <StatTile key={key} label={figures[key].label} value={figures[key].value} />
        ))}
      </div>

      <Card>
        <h2 className="text-base font-semibold">{text.chartTitle}</h2>
        <p className="mb-4 text-sm text-ink-2">
          {text.chartSubtitle}
          {afterTax}.
        </p>
        <SavingsChart result={result} />
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3">
          {totals.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-ink-2">{label}</dt>
              <dd className="font-semibold tabular-nums">{f.euro(value)}</dd>
            </div>
          ))}
        </dl>
        <YearlyTable
          head={[
            t.common.year,
            t.common.deposits,
            t.common.interest,
            t.common.capital,
          ]}
          rows={result.years.map((year) => [
            year.year,
            f.euro(year.deposits),
            f.euro(year.interest),
            f.euro(year.deposits + year.interest),
          ])}
        />
      </Card>

      <Assumptions items={text.assumptions} />
    </>
  );
}
