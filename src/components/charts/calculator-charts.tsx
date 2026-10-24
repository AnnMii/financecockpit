"use client";

import { useLocale } from "@/components/locale-provider";
import type { AvDepotResult } from "@/lib/calculators/av-depot";
import type { PensionGapResult, PensionGapYear } from "@/lib/calculators/pension-gap";
import type { SavingsResult } from "@/lib/calculators/savings";
import type { WithdrawalPlanResult } from "@/lib/calculators/withdrawal-plan";
import { StackedColumns } from "./stacked-columns";

/**
 * The chart of each calculator, built from its result. The calculator pages
 * show them at full height, the cockpit in a compact one.
 */

interface ChartProps<Result> {
  result: Result;
  /** Height in pixels; the chart's default when left out. */
  height?: number;
}

/** A tick every year for short periods, every fifth year for long ones. */
const yearTick = (year: number, count: number) =>
  year % (count > 15 ? 5 : 1) === 0 ? String(year) : "";

/** Wealth per age: contributions, subsidies and growth, against an ETF plan. */
export function AvDepotChart({
  result,
  height,
  compare = true,
}: ChartProps<AvDepotResult> & { compare?: boolean }) {
  const { t, f } = useLocale();
  const text = t.avDepot;
  return (
    <StackedColumns
      height={height}
      data={result.years.map((year) => ({
        tick: year.age % 5 === 0 ? String(year.age) : "",
        title: text.chartColumnTitle(year.age, year.calendarYear),
        values: {
          own: year.av.cumulativeOwnContributions,
          subsidies: year.av.cumulativeSubsidies,
          gains: year.av.cumulativeGains,
        },
        compare: year.normal.capitalEnd,
      }))}
      series={[
        { key: "own", label: text.series.own, color: "var(--series-1)" },
        { key: "subsidies", label: text.series.subsidies, color: "var(--series-2)" },
        { key: "gains", label: text.series.gains, color: "var(--series-3)" },
      ]}
      totalLabel={t.common.wealth}
      compareLabel={compare ? text.etfPlan : undefined}
      formatValue={f.euro}
      formatAxis={f.euroCompact}
      ariaLabel={text.chartAria}
    />
  );
}

/** Wealth per year of life: saving until retirement, then withdrawing the gap. */
export function PensionGapChart({
  result,
  height,
  years = result.years,
}: ChartProps<PensionGapResult> & { years?: PensionGapYear[] }) {
  const { t, f } = useLocale();
  const text = t.pensionGap;
  return (
    <StackedColumns
      height={height}
      data={years.map((year) => ({
        tick: year.age % 5 === 0 ? String(year.age) : "",
        title: t.common.ageN(year.age),
        values: { [year.phase]: year.capital },
      }))}
      series={[
        { key: "saving", label: text.series.saving, color: "var(--series-1)" },
        { key: "payout", label: text.series.payout, color: "var(--series-3)" },
      ]}
      phases
      formatValue={f.euro}
      formatAxis={f.euroCompact}
      ariaLabel={text.chartAria}
    />
  );
}

/** Capital per year, split into deposits and interest. */
export function SavingsChart({
  result,
  height,
  years = result.years,
}: ChartProps<SavingsResult> & { years?: SavingsResult["years"] }) {
  const { t, f } = useLocale();
  return (
    <StackedColumns
      height={height}
      data={years.map((year) => ({
        tick: yearTick(year.year, years.length),
        title: t.common.afterYears(
          f.years(Math.min(year.year, result.durationYears)),
        ),
        values: { deposits: year.deposits, interest: year.interest },
      }))}
      series={[
        { key: "deposits", label: t.common.deposits, color: "var(--series-1)" },
        { key: "interest", label: t.common.interest, color: "var(--series-3)" },
      ]}
      totalLabel={t.common.capital}
      formatValue={f.euro}
      formatAxis={f.euroCompact}
      ariaLabel={t.savings.chartAria}
    />
  );
}

/** Remaining capital at the end of each year. */
export function WithdrawalChart({
  result,
  height,
}: ChartProps<WithdrawalPlanResult>) {
  const { t, f } = useLocale();
  return (
    <StackedColumns
      height={height}
      data={result.years.map((year) => ({
        tick: yearTick(year.year, result.years.length),
        title: t.common.afterYears(f.years(year.year)),
        values: { capital: year.capital },
      }))}
      series={[
        { key: "capital", label: t.common.capital, color: "var(--series-1)" },
      ]}
      formatValue={f.euro}
      formatAxis={f.euroCompact}
      ariaLabel={t.withdrawal.chartAria}
    />
  );
}
