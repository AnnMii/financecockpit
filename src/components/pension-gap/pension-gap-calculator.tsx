"use client";

import {
  Assumptions,
  CalculatorShell,
  YearlyTable,
} from "@/components/calculator-shell";
import { ShareBar } from "@/components/charts/share-bar";
import { StackedColumns } from "@/components/charts/stacked-columns";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { NumberSetting, ToggleSetting } from "@/components/setting-fields";
import { StatTile } from "@/components/stat-tile";
import { usePensionGap } from "@/components/use-calculators";
import type {
  GapClosing,
  PensionGapInput,
  PensionGapResult,
} from "@/lib/calculators/pension-gap";

const sliders = {
  age: { min: 18, max: 66, step: 1 },
  pension: { min: 0, max: 4_000, step: 50 },
  desiredPension: { min: 0, max: 6_000, step: 50 },
};

export function PensionGapCalculator() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

function Workspace() {
  const { t } = useLocale();
  const { input, errors, result } = usePensionGap();
  const text = t.pensionGap;

  return (
    <CalculatorShell
      scope="pension-gap"
      errors={errors}
      form={
        <>
          <Section title={text.sections.entitlements}>
            <NumberSetting
              scope="pension-gap"
              name="statePension"
              slider={sliders.pension}
            />
            <NumberSetting scope="pension-gap" name="companyPension" />
            <NumberSetting scope="pension-gap" name="privatePension" />
            <NumberSetting scope="pension-gap" name="riesterPension" />
          </Section>

          <Section title={text.sections.tax}>
            <NumberSetting scope="pension-gap" name="taxPrediction" />
            <NumberSetting scope="pension-gap" name="yearlyTaxFreeAmount" />
          </Section>

          <Section title={text.sections.desired}>
            <NumberSetting
              scope="pension-gap"
              name="desiredPension"
              slider={sliders.desiredPension}
            />
          </Section>

          <Section title={text.sections.retirement}>
            <NumberSetting scope="shared" name="retirementAge" />
            <NumberSetting scope="shared" name="payoutUntilAge" />
            <NumberSetting scope="shared" name="retirementReturn" />
          </Section>

          <Section title={text.sections.saving}>
            <NumberSetting scope="shared" name="age" slider={sliders.age} />
            <NumberSetting scope="shared" name="currentCapital" />
            <NumberSetting
              scope="shared"
              name="expectedReturn"
              label={text.returnUntilRetirement}
              hint={text.returnUntilRetirementHint}
            />
            <NumberSetting scope="shared" name="capitalGainsTax" />
          </Section>

          <Section title={text.sections.inflation}>
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
  const { t, f } = useLocale();
  const text = t.pensionGap;
  return (
    <Card>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-ink-2">{description}</p>
      {closing ? (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-ink-2">{text.capitalAtRetirement}</dt>
            <dd className="text-2xl font-semibold">{f.euro(closing.capital)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-2">{text.savingsRatePerMonth}</dt>
            <dd className="text-2xl font-semibold">
              {f.euroCents(closing.savingsRate)}
            </dd>
            <dd className="text-xs text-ink-2">
              {t.common.overYears(f.years(years))}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-ink">{text.notPossible}</p>
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
  const { t, f } = useLocale();
  const text = t.pensionGap;

  const series = [
    { key: "saving", label: text.series.saving, color: "var(--series-1)" },
    { key: "payout", label: text.series.payout, color: "var(--series-3)" },
  ];
  const chartData = result.years.map((year) => ({
    tick: year.age % 5 === 0 ? String(year.age) : "",
    title: t.common.ageN(year.age),
    values: { [year.phase]: year.capital },
  }));

  return (
    <>
      <StatTile
        hero
        label={text.heroLabel}
        value={f.euro(result.gap)}
        note={
          result.gap === 0
            ? text.heroCovered
            : text.heroNote(
                f.euro(result.netPension),
                f.euro(input.desiredPension),
              )
        }
      />

      <Card>
        <h2 className="mb-4 text-base font-semibold">{text.overviewTitle}</h2>
        <ShareBar
          ariaLabel={text.overviewAria}
          formatValue={f.euro}
          shares={[
            {
              label: text.netPension,
              value: Math.min(result.netPension, input.desiredPension),
              color: "var(--series-1)",
            },
            { label: text.gap, value: result.gap },
          ]}
        />
        <p className="mt-3 text-xs text-ink-2">
          {text.grossNote(
            f.euro(result.grossPension),
            f.euro(result.grossPension - result.netPension),
          )}
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <ClosingCard
          title={text.withConsumption}
          description={text.withConsumptionNote(input.payoutUntilAge)}
          closing={result.withConsumption}
          years={result.yearsUntilRetirement}
        />
        <ClosingCard
          title={text.withoutConsumption}
          description={text.withoutConsumptionNote}
          closing={result.withoutConsumption}
          years={result.yearsUntilRetirement}
        />
      </div>

      <Card>
        <h2 className="text-base font-semibold">{text.chartTitle}</h2>
        <p className="mb-4 text-sm text-ink-2">
          {text.chartSubtitle(input.retirementAge)}
        </p>
        <StackedColumns
          data={chartData}
          series={series}
          phases
          formatValue={f.euro}
          formatAxis={f.euroCompact}
          ariaLabel={text.chartAria}
        />
        <YearlyTable
          head={[t.common.age, text.phase, t.common.wealth]}
          rows={result.years.map((year) => [
            year.age,
            text.series[year.phase],
            f.euro(year.capital),
          ])}
        />
      </Card>

      <Assumptions items={text.assumptions} />
    </>
  );
}
