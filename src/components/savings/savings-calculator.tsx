"use client";

import { useState } from "react";
import { AdvancedSwitch } from "@/components/advanced-switch";
import { useAccess } from "@/components/access-provider";
import { useAdvancedInputs } from "@/components/preferences-provider";
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
  withoutTax,
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
    realTerms,
    saveInterval,
  } = settings.savings;
  const { age, retirementAge } = settings.shared;
  // Targets at or below this are already reached without the searched figure.
  const minimum = minimumEndValue(input);
  const perYear = t.common.perYearEquals(
    f.euro(settings.savings.savingsRateMonthly * 12),
  );

  // The advanced inputs start hidden to keep the calculator simple. With an
  // error they are shown anyway: it may be one of them that has to change.
  const [advanced, setAdvanced] = useAdvancedInputs();
  const { beta } = useAccess();
  const forced = errors.length > 0;
  const showAdvanced = advanced || forced;

  return (
    <CalculatorShell
      scope="savings"
      errors={errors}
      form={
        <>
          <AdvancedSwitch
            checked={advanced}
            forced={forced}
            onChange={setAdvanced}
          />

          <Section title={text.sections.calculation}>
            {beta ? (
              <>
                <SelectSetting scope="savings" name="output" />
                <p className="text-xs text-ink-2">{text.searchedFieldHint}</p>
              </>
            ) : (
              <p className="text-sm text-ink-2">{text.betaNote}</p>
            )}
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
            {showAdvanced && (
              <SelectSetting scope="savings" name="saveInterval" />
            )}
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
            {showAdvanced && (
              <>
                <NumberSetting scope="savings" name="costs" />
                <SelectSetting scope="savings" name="interestInterval" />
                <ToggleSetting scope="savings" name="realTerms" />
                {realTerms && (
                  <NumberSetting scope="shared" name="inflationRate" />
                )}
              </>
            )}
          </Section>

          {showAdvanced && (
            <Section title={text.sections.tax}>
              <ToggleSetting scope="savings" name="considerTax" />
              {considerTax && (
                <>
                  <NumberSetting scope="shared" name="capitalGainsTax" />
                  <SelectSetting scope="savings" name="distributionType" />
                  <ToggleSetting
                    scope="savings"
                    name="considerPartialExemption"
                  />
                  {considerPartialExemption && (
                    <NumberSetting scope="savings" name="partialExemption" />
                  )}
                </>
              )}
            </Section>
          )}
        </>
      }
    >
      {result && (
        <>
          {input.inflation ? (
            <p className="text-sm text-ink-2">{text.realNote}</p>
          ) : null}
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
  input: SavingsInput;
  result: SavingsResult;
}) {
  const { t, f } = useLocale();
  const text = t.savings;
  const perInterval =
    input.saveInterval === "monthly" ? t.common.perMonth : t.common.perYear;
  const afterTax = !input.considerTax
    ? ""
    : input.distributionType === "accumulating"
      ? text.afterTaxSale
      : text.afterTax;
  // The same plan before taxes, to show what the taxes cost and to compare.
  const untaxed = input.considerTax ? withoutTax(input, result) : null;
  const [taxView, setTaxView] = useState<"after" | "before">("after");
  const showing = taxView === "before" && untaxed ? "before" : "after";
  const shownYears = showing === "before" ? untaxed!.years : result.years;

  const figures = {
    endValue: {
      label: `${t.common.endValue}${afterTax}`,
      value: f.euro(result.endValue),
    },
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
    [`${t.common.endValue}${afterTax}`, result.endValue],
    ...(untaxed
      ? ([
          [text.endValueBeforeTax, untaxed.endValue],
          [text.taxTotal, untaxed.endValue - result.endValue],
        ] as [string, number][])
      : []),
  ];

  return (
    <>
      <StatTile
        hero
        label={input.output === "endValue" ? searched.label : `${searched.label} [beta]`}
        value={searched.value}
        note={
          result.alreadyReached && input.output !== "endValue"
            ? text.alreadyReached[input.output](
                f.euro(input.endValue),
                // What the plan reaches without the searched figure.
                f.euro(minimumEndValue(input) ?? result.endValue),
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{text.chartTitle}</h2>
            <p className="mb-4 text-sm text-ink-2">
              {text.chartSubtitle}
              {showing === "before" ? "" : afterTax}.
            </p>
          </div>
          {untaxed && (
            <div role="group" aria-label={text.chartViewLabel} className="flex text-xs">
              {(["before", "after"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={showing === option}
                  onClick={() => setTaxView(option)}
                  className={`border border-axis px-3 py-1.5 first:rounded-l-md last:rounded-r-md last:border-l-0 ${
                    showing === option
                      ? "bg-accent-wash font-semibold text-accent"
                      : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {option === "before"
                    ? text.chartViews.before
                    : input.distributionType === "accumulating"
                      ? text.chartViews.afterSale
                      : text.chartViews.after}
                </button>
              ))}
            </div>
          )}
        </div>
        <SavingsChart result={result} years={shownYears} />
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
          rows={shownYears.map((year) => [
            year.year,
            f.euro(year.deposits),
            f.euro(year.interest),
            f.euro(year.deposits + year.interest),
          ])}
        />
      </Card>

      <Assumptions
        items={[
          text.assumptions[0],
          // What the chart shows depends on the tax switches.
          ...(input.considerTax
            ? [
                input.distributionType === "distributing"
                  ? text.taxAssumptions.distributing
                  : text.taxAssumptions.accumulating,
                ...(input.partialExemption > 0 ? [text.taxAssumptions.exemption] : []),
                text.taxAssumptions.allowance,
              ]
            : [text.taxAssumptions.off]),
          ...text.assumptions.slice(1),
        ]}
      />
    </>
  );
}
