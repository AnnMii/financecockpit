"use client";

import { useState } from "react";
import {
  Assumptions,
  CalculatorShell,
  YearlyTable,
} from "@/components/calculator-shell";
import { ShareBar } from "@/components/charts/share-bar";
import { PensionGapChart } from "@/components/charts/calculator-charts";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { ProfilePicker } from "@/components/profile-picker";
import { NumberSetting, ToggleSetting } from "@/components/setting-fields";
import { useSettingsEditor } from "@/components/settings-provider";
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
  const { settings } = useSettingsEditor();
  const text = t.pensionGap;
  const like = settings["pension-gap"].savingsLikeCalculator;
  const savings = settings.savings;
  const likeTax = !savings.considerTax
    ? text.savingsLikeTax.off
    : text.savingsLikeTax[savings.distributionType];

  return (
    <CalculatorShell
      scope="pension-gap"
      errors={errors}
      form={
        <>
          <Section title={text.sections.entitlements}>
            <NumberSetting
              scope="shared"
              name="statePension"
              slider={sliders.pension}
            />
            <NumberSetting scope="shared" name="companyPension" />
            <NumberSetting scope="shared" name="privatePension" />
            <NumberSetting scope="shared" name="riesterPension" />
          </Section>

          <Section title={text.sections.tax}>
            <NumberSetting scope="shared" name="taxPrediction" />
            <NumberSetting scope="shared" name="yearlyTaxFreeAmount" />
          </Section>

          <Section title={text.sections.desired}>
            <NumberSetting
              scope="shared"
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
            <ToggleSetting scope="pension-gap" name="savingsLikeCalculator" />
            {like ? (
              <>
                <ProfilePicker scope="savings" />
                <p className="text-xs text-ink-2">{text.savingsLikeNote(likeTax)}</p>
              </>
            ) : (
              <NumberSetting scope="shared" name="capitalGainsTax" />
            )}
          </Section>

          <Section title={text.sections.inflation}>
            <ToggleSetting scope="shared" name="considerInflation" />
            {settings.shared.considerInflation && (
              <NumberSetting scope="shared" name="inflationRate" />
            )}
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
  // The savings rate that is needed against what can be invested per month.
  const budget = useSettingsEditor().settings.shared.investableMonthly;
  const missing = closing ? Math.round((closing.savingsRate - budget) * 100) / 100 : 0;
  const fits = missing <= 0;
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
      {closing && (
        <p
          role="status"
          className={`mt-4 flex gap-2 rounded-md border px-3 py-2 text-sm ${
            fits ? "border-good/40 text-good" : "border-critical/40 text-critical"
          }`}
        >
          <span aria-hidden="true">{fits ? "✓" : "✗"}</span>
          <span>
            {fits
              ? text.budgetFits(f.euro(budget))
              : text.budgetExceeded(f.euro(budget), f.euroCents(missing))}
          </span>
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
  const { t, f } = useLocale();
  const text = t.pensionGap;
  const [view, setView] = useState<"with" | "without">("with");
  const { shared } = useSettingsEditor().settings;
  // Falls back to the first course when the second does not exist (the interest is not enough).
  const showing = view === "without" && result.yearsWithoutConsumption ? "without" : "with";
  const shownYears =
    showing === "without" ? result.yearsWithoutConsumption! : result.years;

  // Existing capital that already grows beyond what is needed: nothing has to
  // be saved, and the payout does not use the capital up. The chart then shows
  // a high, hardly falling course, which this note explains.
  const atRetirement =
    [...result.years].reverse().find((year) => year.phase === "saving")?.capital ??
    input.currentCapital;
  const atEnd = result.years.at(-1)?.capital ?? 0;
  const needed = result.withConsumption.capital;
  const surplus =
    result.gap > 0 &&
    result.withConsumption.savingsRate === 0 &&
    atRetirement > needed * 1.01;
  const buffer = atRetirement - needed;
  const bufferShare = needed > 0 ? buffer / needed : 0;

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

      <p className="-mt-2 text-xs text-ink-2">
        {input.considerInflation
          ? text.inflationOn(f.percent(shared.inflationRate))
          : text.inflationOff}
      </p>

      {surplus && (
        <section
          role="status"
          className="rounded-xl border border-l-4 border-line border-l-good bg-surface p-5"
        >
          <h2 className="flex items-center gap-2 text-base font-semibold text-good">
            <span aria-hidden="true">✓</span>
            {bufferShare >= 0.2 ? text.onPlanTitleClear : text.onPlanTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {text.onPlanText(
              f.euro(atRetirement),
              f.euro(needed),
              f.euro(buffer),
              f.percent(Math.round(bufferShare * 100)),
              input.payoutUntilAge,
              f.euro(atEnd),
            )}
          </p>
        </section>
      )}

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">
              {showing === "without" ? text.chartTitleWithout : text.chartTitle}
            </h2>
            <p className="mb-4 text-sm text-ink-2">
              {showing === "without"
                ? text.chartSubtitleWithout(input.retirementAge)
                : text.chartSubtitle(input.retirementAge)}
            </p>
          </div>
          {result.yearsWithoutConsumption && (
            <div
              role="group"
              aria-label={text.chartViewLabel}
              className="flex text-xs"
            >
              {(["with", "without"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={showing === option}
                  onClick={() => setView(option)}
                  className={`border border-axis px-3 py-1.5 first:rounded-l-md last:rounded-r-md last:border-l-0 ${
                    showing === option
                      ? "bg-accent-wash font-semibold text-accent"
                      : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {text.chartViews[option]}
                </button>
              ))}
            </div>
          )}
        </div>
        <PensionGapChart result={result} years={shownYears} />
        <YearlyTable
          head={[t.common.age, text.phase, t.common.wealth]}
          rows={shownYears.map((year) => [
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
