"use client";

import { useState } from "react";
import { Assumptions, YearlyTable } from "@/components/calculator-shell";
import { AvDepotChart } from "@/components/charts/calculator-charts";
import { niceStep } from "@/components/charts/stacked-columns";
import { Card } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { StatTile } from "@/components/stat-tile";
import type {
  AvDepotInput,
  AvDepotResult,
  PayoutYear,
} from "@/lib/calculators/av-depot";

/** Share of the row that the longest possible bar takes; the figure sits behind it. */
const BAR_SPACE = 75;

function MonthlyPayoutBars({ av, normal }: { av: number; normal: number }) {
  const { t, f } = useLocale();
  // A fixed scale with ticks, not "the larger bar is always full": otherwise
  // the bar of the higher pension never moves when an input changes.
  const max = Math.max(av, normal, 1);
  const step = niceStep(max, 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const difference = Math.round(av - normal);
  const rows = [
    { label: t.avDepot.name, value: av, color: "var(--series-1)" },
    { label: t.avDepot.etfPlan, value: normal, color: "var(--series-compare)" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="mb-1 text-sm text-ink-2">{row.label}</p>
          <div className="flex items-center gap-3">
            <div
              className="h-5 rounded-r-sm"
              style={{
                width: `${(row.value / top) * BAR_SPACE}%`,
                minWidth: 2,
                background: row.color,
              }}
            />
            <span className="text-sm font-semibold tabular-nums text-ink">
              {f.euro(row.value)}
            </span>
          </div>
        </div>
      ))}
      <div className="relative h-5 border-t border-grid text-xs text-muted" aria-hidden="true">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute top-1 -translate-x-1/2 tabular-nums first:translate-x-0"
            style={{ left: `${(tick / top) * BAR_SPACE}%` }}
          >
            {f.euro(tick)}
          </span>
        ))}
      </div>
      {difference !== 0 && (
        <p className="text-sm text-ink-2">
          {difference > 0
            ? t.avDepot.monthlyBetter(f.euro(difference))
            : t.avDepot.monthlyWorse(f.euro(-difference))}
        </p>
      )}
    </div>
  );
}

function PayoutTable({ result }: { result: AvDepotResult }) {
  const { t, f } = useLocale();
  const text = t.avDepot;
  const rows: {
    label: string;
    pick: (p: AvDepotResult["av"]["payout"]) => PayoutYear;
  }[] = [
    { label: text.firstYear, pick: (p) => p.firstYear },
    { label: text.laterYears, pick: (p) => p.regularYear },
    { label: text.totalYears(result.payoutYears), pick: (p) => p.total },
  ];
  const columns = [text.gross, text.tax, text.net];
  const cell = "px-2 py-2 text-right tabular-nums";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[31rem] text-sm">
        <thead>
          <tr className="text-xs text-ink-2">
            <th className="px-3 py-2 text-left font-medium" rowSpan={2}>
              {text.payout}
            </th>
            <th className="px-3 pt-2 text-center font-medium" colSpan={3}>
              {text.name}
            </th>
            <th
              className="border-l border-line px-3 pt-2 text-center font-medium"
              colSpan={3}
            >
              {text.etfPlan}
            </th>
          </tr>
          <tr className="border-b border-line text-xs text-ink-2">
            {columns.map((heading) => (
              <th key={`av-${heading}`} className="px-2 py-2 text-right font-medium">
                {heading}
              </th>
            ))}
            {columns.map((heading, i) => (
              <th
                key={`etf-${heading}`}
                className={`px-2 py-2 text-right font-medium ${i === 0 ? "border-l border-line" : ""}`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const av = row.pick(result.av.payout);
            const normal = row.pick(result.normal.payout);
            return (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th className="px-3 py-2 text-left font-normal text-ink-2">
                  {row.label}
                </th>
                <td className={cell}>{f.euro(av.gross)}</td>
                <td className={cell}>{f.euro(av.tax)}</td>
                <td className={`${cell} font-semibold`}>{f.euro(av.net)}</td>
                <td className={`${cell} border-l border-line`}>
                  {f.euro(normal.gross)}
                </td>
                <td className={cell}>{f.euro(normal.tax)}</td>
                <td className={`${cell} font-semibold`}>{f.euro(normal.net)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AvDepotResults({
  input,
  result,
}: {
  input: AvDepotInput;
  result: AvDepotResult;
}) {
  const { t, f } = useLocale();
  const text = t.avDepot;
  const [compare, setCompare] = useState(true);
  const { av, normal } = result;
  const consumed = av.taxSavings - av.investedTaxSavings;

  const totals: [string, number][] = [
    [text.series.own, av.ownContributions],
    [text.allowances, av.allowances],
    [text.investedTaxSavings, av.investedTaxSavings],
    [text.series.gains, av.gains],
  ];

  return (
    <>
      <StatTile
        hero
        label={text.heroLabel(input.retirementAge)}
        value={f.euro(av.finalCapital)}
        note={
          <>
            {text.heroNote}{" "}
            <strong className="font-semibold text-ink">
              {f.euro(normal.finalCapital)}
            </strong>
            .
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatTile
          label={text.netPensionPerMonth}
          value={f.euro(av.payout.monthlyNet)}
          note={text.avUntilAge(input.payoutUntilAge)}
        />
        <StatTile
          label={text.netPensionPerMonth}
          value={f.euro(normal.payout.monthlyNet)}
          note={text.etfSamePlan}
        />
        <StatTile
          label={text.totalSubsidies}
          value={f.euro(av.allowances + av.taxSavings)}
          note={text.subsidiesBreakdown(
            f.euro(av.allowances),
            f.euro(av.taxSavings),
          )}
        />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{text.chartTitle}</h2>
            <p className="text-sm text-ink-2">
              {text.chartSubtitle}
              {av.secondaryDepotCapital > 0 && text.chartSubtitleSecondary}.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={compare}
              onChange={(event) => setCompare(event.target.checked)}
              className="size-4 accent-(--accent)"
            />
            {text.compareToggle}
          </label>
        </div>
        <AvDepotChart result={result} compare={compare} />
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-4">
          {totals.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-ink-2">{label}</dt>
              <dd className="font-semibold tabular-nums">{f.euro(value)}</dd>
            </div>
          ))}
        </dl>
        {consumed > 0.5 && (
          <p className="mt-3 text-xs text-ink-2">
            {text.consumedNote(f.euro(consumed))}
          </p>
        )}
        <YearlyTable
          head={[
            t.common.age,
            t.common.year,
            text.allowances,
            text.taxSavings,
            text.name,
            text.etfPlan,
          ]}
          rows={result.years.map((year) => [
            year.age,
            year.calendarYear,
            f.euro(
              year.av.grundzulage + year.av.kinderzulage + year.av.starterBonus,
            ),
            f.euro(year.av.taxSaving),
            f.euro(year.av.capitalEnd),
            f.euro(year.normal.capitalEnd),
          ])}
        />
      </Card>

      <Card>
        <h2 className="text-base font-semibold">{text.monthlyTitle}</h2>
        <p className="mb-4 text-sm text-ink-2">
          {text.monthlySubtitle(input.retirementAge, input.payoutUntilAge)}
        </p>
        <MonthlyPayoutBars
          av={av.payout.monthlyNet}
          normal={normal.payout.monthlyNet}
        />
      </Card>

      <Card>
        <h2 className="text-base font-semibold">{text.payoutTitle}</h2>
        <p className="mb-3 text-sm text-ink-2">{text.payoutSubtitle}</p>
        <PayoutTable result={result} />
      </Card>

      <Assumptions items={text.assumptions} />
    </>
  );
}
