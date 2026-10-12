"use client";

import Link from "next/link";
import { useAvDepot } from "@/components/av-depot/use-av-depot";
import {
  AvDepotChart,
  PensionGapChart,
  SavingsChart,
  WithdrawalChart,
} from "@/components/charts/calculator-charts";
import { Card } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { usePlan, usePlanRecords } from "@/components/plan/plan-records";
import {
  PlanBreakdown,
  PlanCorridor,
  PlanStatus,
  formatDate,
  useToday,
} from "@/components/plan/plan-views";
import { ProfilePicker } from "@/components/profile-picker";
import { useSettingsEditor } from "@/components/settings-provider";
import {
  usePensionGap,
  useSavings,
  useWithdrawalPlan,
} from "@/components/use-calculators";
import { perIntervalText } from "@/components/withdrawal-plan/withdrawal-plan-calculator";
import type { CalculationError } from "@/lib/calculators/errors";
import { type CalculatorInfo, calculators } from "@/lib/calculators/registry";

interface Figure {
  label: string;
  value: string;
}

const calculatorById = Object.fromEntries(
  calculators.map((calculator) => [calculator.id, calculator]),
) as Record<CalculatorInfo["id"], CalculatorInfo>;

// Height of the charts on the cockpit cards.
const CHART_HEIGHT = 190;

/** One calculator's key figures and chart, or why it cannot calculate. */
function CalculatorCard({
  id,
  figures,
  note,
  chart,
  errors,
}: {
  id: CalculatorInfo["id"];
  figures: Figure[] | null;
  /** Whether the amounts are before or after taxes. */
  note: string;
  chart: React.ReactNode;
  errors: CalculationError[];
}) {
  const { t } = useLocale();
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">{t.calculators[id].title}</h3>
        <Link
          href={calculatorById[id].href}
          className="shrink-0 text-sm font-medium text-accent"
        >
          {t.dashboard.openCalculator}
        </Link>
      </div>
      {figures ? (
        <>
          <dl className="divide-y divide-line text-sm">
            {figures.map((figure) => (
              <div key={figure.label} className="flex justify-between gap-4 py-2">
                <dt className="text-ink-2">{figure.label}</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-ink-2">{note}</p>
          <div className="mt-4">{chart}</div>
        </>
      ) : (
        <p className="text-sm text-ink-2">
          {t.dashboard.notCalculable} {t.calcErrors[errors[0]]}
        </p>
      )}
    </Card>
  );
}

/** The Gesamtplan at a glance: status, corridor and a reminder to record balances. */
function PlanSection() {
  const { locale, t, f } = useLocale();
  const { settings } = useSettingsEditor();
  const text = t.plan;
  const today = useToday();
  const { input, errors, result, snapshot } = usePlan();
  const { versions, snapshots } = usePlanRecords();
  const version = versions.at(-1);
  const oneYearAgo = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`;

  return (
    <section aria-labelledby="plan-heading" className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="plan-heading" className="text-base font-semibold">
          {text.pageTitle}
        </h2>
        <p className="flex gap-4 text-sm font-medium">
          <Link href="/plan" className="text-accent">
            {text.openPlan}
          </Link>
          <Link href="/verlauf" className="text-accent">
            {text.openHistory}
          </Link>
        </p>
      </div>

      {(!snapshot || snapshot.date < oneYearAgo) && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
          {snapshot
            ? text.staleSnapshot(formatDate(locale, snapshot.date))
            : text.noSnapshot(f.euro(settings.shared.currentCapital))}{" "}
          <Link href="/verlauf" className="font-medium text-accent">
            {text.recordSnapshot}
          </Link>
        </p>
      )}

      {result ? (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <PlanStatus input={input} result={result} />
            <Card>
              <h3 className="text-base font-semibold">{text.corridorTitle}</h3>
              <p className="mb-4 text-sm text-ink-2">{text.corridorSubtitle}</p>
              <PlanCorridor
                result={result}
                version={version}
                snapshots={snapshots}
                height={240}
              />
            </Card>
          </div>
          <PlanBreakdown input={input} result={result} />
        </>
      ) : (
        <Card>
          <p className="text-sm text-ink-2">
            {t.dashboard.notCalculable} {t.calcErrors[errors[0]]}
          </p>
        </Card>
      )}
    </section>
  );
}

export function Dashboard() {
  const { t, f } = useLocale();
  const { settings } = useSettingsEditor();
  const text = t.dashboard;
  const avDepot = useAvDepot();
  const pensionGap = usePensionGap();
  const savings = useSavings();
  const withdrawal = useWithdrawalPlan();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold">{t.profiles.heading}</h2>
        <p className="mb-4 text-sm text-ink-2">{text.profilesHint}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfilePicker scope="shared" />
          <ProfilePicker scope="plan" />
          {calculators.map((calculator) => (
            <ProfilePicker key={calculator.id} scope={calculator.id} />
          ))}
        </div>
      </Card>

      <PlanSection />

      <section aria-labelledby="calculators-heading" className="space-y-5">
        <div>
          <h2 id="calculators-heading" className="text-base font-semibold">
            {text.resultsHeading}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-ink-2">{text.resultsNote}</p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CalculatorCard
            id="pension-gap"
            note={`${text.taxNote.pensionGap} ${
              settings.shared.considerInflation
                ? text.currencyNote.real
                : text.currencyNote.nominal
            }`}
            errors={pensionGap.errors}
            chart={
              pensionGap.result && (
                <PensionGapChart result={pensionGap.result} height={CHART_HEIGHT} />
              )
            }
            figures={
              pensionGap.result && [
                { label: text.gapPerMonth, value: f.euro(pensionGap.result.gap) },
                {
                  label: text.netPensionMonthly,
                  value: f.euro(pensionGap.result.netPension),
                },
                {
                  label: text.capitalWithConsumption,
                  value: f.euro(pensionGap.result.withConsumption.capital),
                },
                {
                  label: text.savingsRateNeeded,
                  value: f.euroCents(pensionGap.result.withConsumption.savingsRate),
                },
              ]
            }
          />
          <CalculatorCard
            id="av-depot"
            note={`${text.taxNote.avDepot} ${text.currencyNote.nominal}`}
            errors={avDepot.errors}
            chart={
              avDepot.result && (
                <AvDepotChart result={avDepot.result} height={CHART_HEIGHT} />
              )
            }
            figures={
              avDepot.result && [
                {
                  label: text.avFinalCapital(avDepot.input.retirementAge),
                  value: f.euro(avDepot.result.av.finalCapital),
                },
                {
                  label: text.netPensionPerMonth,
                  value: f.euro(avDepot.result.av.payout.monthlyNet),
                },
                {
                  label: text.etfComparison,
                  value: f.euro(avDepot.result.normal.payout.monthlyNet),
                },
                {
                  label: text.totalSubsidies,
                  value: f.euro(
                    avDepot.result.av.allowances + avDepot.result.av.taxSavings,
                  ),
                },
              ]
            }
          />
          <CalculatorCard
            id="savings"
            note={`${
              !savings.input.considerTax
                ? text.taxNote.savingsBefore
                : savings.input.distributionType === "distributing"
                  ? text.taxNote.savingsDistributing
                  : text.taxNote.savingsAccumulating
            } ${text.currencyNote.nominal}`}
            errors={savings.errors}
            chart={
              savings.result && (
                <SavingsChart result={savings.result} height={CHART_HEIGHT} />
              )
            }
            figures={
              savings.result && [
                {
                  label: text.searchedFor(
                    t.selects.savings.output.options[savings.input.output],
                  ),
                  value: {
                    endValue: f.euro(savings.result.endValue),
                    startValue: f.euro(savings.result.startValue),
                    yearlyInterest: f.percent(savings.result.yearlyInterest),
                    duration: f.years(savings.result.durationYears),
                    savingRate: f.euroCents(savings.result.savingRate),
                  }[savings.input.output],
                },
                savings.input.output === "endValue"
                  ? {
                      label: text.duration,
                      value: f.years(savings.result.durationYears),
                    }
                  : {
                      label: t.common.endValue,
                      value: f.euro(savings.result.endValue),
                    },
                {
                  label: text.totalDeposits,
                  value: f.euro(savings.result.deposits),
                },
                { label: t.common.interest, value: f.euro(savings.result.interest) },
              ]
            }
          />
          <CalculatorCard
            id="withdrawal-plan"
            note={`${
              settings["withdrawal-plan"].considerTax
                ? text.taxNote.withdrawalTaxed
                : text.taxNote.withdrawal
            } ${
              settings["withdrawal-plan"].realTerms
                ? text.currencyNote.real
                : text.currencyNote.nominal
            }`}
            errors={withdrawal.errors}
            chart={
              withdrawal.result && (
                <WithdrawalChart result={withdrawal.result} height={CHART_HEIGHT} />
              )
            }
            figures={
              withdrawal.result && [
                {
                  label: text.searched,
                  value:
                    t.selects["withdrawal-plan"].output.options[
                      withdrawal.input.output
                    ],
                },
                {
                  label: text.withdrawalAmount(
                    perIntervalText(t, withdrawal.input.interval),
                  ),
                  value: f.euroCents(withdrawal.result.amount),
                },
                {
                  label: text.withdrawalPeriod,
                  value:
                    withdrawal.result.periodYears === null
                      ? t.common.endless
                      : f.years(withdrawal.result.periodYears),
                },
                {
                  label: text.capitalAssets,
                  value: f.euro(withdrawal.result.capital),
                },
              ]
            }
          />
        </div>
      </section>
    </div>
  );
}
