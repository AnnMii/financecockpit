"use client";

import { useState } from "react";
import { StackedColumns } from "@/components/charts/stacked-columns";
import { Card } from "@/components/fields";
import { StatTile } from "@/components/stat-tile";
import type {
  AvDepotInput,
  AvDepotResult,
  PayoutYear,
} from "@/lib/calculators/av-depot";
import { formatEuro, formatEuroCompact } from "@/lib/format";

const SERIES = [
  { key: "own", label: "Einzahlungen", color: "var(--series-1)" },
  { key: "subsidies", label: "Förderung", color: "var(--series-2)" },
  { key: "gains", label: "Wertzuwachs", color: "var(--series-3)" },
];

function MonthlyPayoutBars({ av, normal }: { av: number; normal: number }) {
  const max = Math.max(av, normal, 1);
  const rows = [
    { label: "Altersvorsorgedepot", value: av, color: "var(--series-1)" },
    { label: "ETF-Sparplan", value: normal, color: "var(--series-compare)" },
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
                width: `${(row.value / max) * 75}%`,
                minWidth: 2,
                background: row.color,
              }}
            />
            <span className="text-sm font-semibold tabular-nums text-ink">
              {formatEuro(row.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PayoutTable({ result }: { result: AvDepotResult }) {
  const rows: { label: string; pick: (p: AvDepotResult["av"]["payout"]) => PayoutYear }[] = [
    { label: "1. Jahr", pick: (p) => p.firstYear },
    { label: "Folgejahre, je Jahr", pick: (p) => p.regularYear },
    { label: `Summe (${result.payoutYears} Jahre)`, pick: (p) => p.total },
  ];
  const cell = "px-2 py-2 text-right tabular-nums";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[31rem] text-sm">
        <thead>
          <tr className="text-xs text-ink-2">
            <th className="px-3 py-2 text-left font-medium" rowSpan={2}>
              Auszahlung
            </th>
            <th className="px-3 pt-2 text-center font-medium" colSpan={3}>
              Altersvorsorgedepot
            </th>
            <th className="border-l border-line px-3 pt-2 text-center font-medium" colSpan={3}>
              ETF-Sparplan
            </th>
          </tr>
          <tr className="border-b border-line text-xs text-ink-2">
            {["Brutto", "Steuer", "Netto"].map((h) => (
              <th key={`av-${h}`} className="px-2 py-2 text-right font-medium">
                {h}
              </th>
            ))}
            {["Brutto", "Steuer", "Netto"].map((h, i) => (
              <th
                key={`n-${h}`}
                className={`px-2 py-2 text-right font-medium ${i === 0 ? "border-l border-line" : ""}`}
              >
                {h}
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
                <td className={cell}>{formatEuro(av.gross)}</td>
                <td className={cell}>{formatEuro(av.tax)}</td>
                <td className={`${cell} font-semibold`}>{formatEuro(av.net)}</td>
                <td className={`${cell} border-l border-line`}>
                  {formatEuro(normal.gross)}
                </td>
                <td className={cell}>{formatEuro(normal.tax)}</td>
                <td className={`${cell} font-semibold`}>{formatEuro(normal.net)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function YearTable({ result }: { result: AvDepotResult }) {
  const cell = "px-3 py-1.5 text-right tabular-nums";
  return (
    <div className="max-h-96 overflow-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="sticky top-0 bg-surface text-xs text-ink-2">
          <tr className="border-b border-line">
            <th className="px-3 py-2 text-left font-medium">Alter</th>
            <th className="px-3 py-2 text-right font-medium">Jahr</th>
            <th className="px-3 py-2 text-right font-medium">Zulagen</th>
            <th className="px-3 py-2 text-right font-medium">Steuerersparnis</th>
            <th className="px-3 py-2 text-right font-medium">Altersvorsorgedepot</th>
            <th className="px-3 py-2 text-right font-medium">ETF-Sparplan</th>
          </tr>
        </thead>
        <tbody>
          {result.years.map((year) => (
            <tr key={year.age} className="border-b border-line last:border-0">
              <td className="px-3 py-1.5 tabular-nums">{year.age}</td>
              <td className={cell}>{year.calendarYear}</td>
              <td className={cell}>
                {formatEuro(
                  year.av.grundzulage + year.av.kinderzulage + year.av.starterBonus,
                )}
              </td>
              <td className={cell}>{formatEuro(year.av.taxSaving)}</td>
              <td className={cell}>{formatEuro(year.av.capitalEnd)}</td>
              <td className={cell}>{formatEuro(year.normal.capitalEnd)}</td>
            </tr>
          ))}
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
  const [compare, setCompare] = useState(true);
  const { av, normal } = result;
  const consumed = av.taxSavings - av.investedTaxSavings;

  const chartData = result.years.map((year) => ({
    tick: year.age % 5 === 0 ? String(year.age) : "",
    title: `Alter ${year.age} · ${year.calendarYear}`,
    values: {
      own: year.av.cumulativeOwnContributions,
      subsidies: year.av.cumulativeSubsidies,
      gains: year.av.cumulativeGains,
    },
    compare: year.normal.capitalEnd,
  }));

  return (
    <>
      <StatTile
        hero
        label={`Endvermögen im Altersvorsorgedepot mit ${input.retirementAge} Jahren`}
        value={formatEuro(av.finalCapital)}
        note={
          <>
            Inklusive Förderung und Rendite, nach Kosten, vor Steuern. Ein
            ETF-Sparplan mit denselben Einzahlungen käme auf{" "}
            <strong className="font-semibold text-ink">
              {formatEuro(normal.finalCapital)}
            </strong>
            .
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatTile
          label="Netto-Rente pro Monat"
          value={formatEuro(av.payout.monthlyNet)}
          note={`Altersvorsorgedepot, bis Alter ${input.payoutUntilAge}`}
        />
        <StatTile
          label="Netto-Rente pro Monat"
          value={formatEuro(normal.payout.monthlyNet)}
          note="ETF-Sparplan, gleicher Auszahlplan"
        />
        <StatTile
          label="Förderung gesamt"
          value={formatEuro(av.allowances + av.taxSavings)}
          note={`${formatEuro(av.allowances)} Zulagen + ${formatEuro(av.taxSavings)} Steuerersparnis`}
        />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Vermögen in der Ansparphase</h2>
            <p className="text-sm text-ink-2">
              Stand am Jahresende nach Alter, im Altersvorsorgedepot
              {av.secondaryDepotCapital > 0 && " inklusive separatem Depot"}.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              checked={compare}
              onChange={(event) => setCompare(event.target.checked)}
              className="size-4 accent-(--accent)"
            />
            Mit ETF-Sparplan vergleichen
          </label>
        </div>
        <StackedColumns
          data={chartData}
          series={SERIES}
          totalLabel="Vermögen"
          compareLabel={compare ? "ETF-Sparplan" : undefined}
          formatValue={formatEuro}
          formatAxis={formatEuroCompact}
          ariaLabel="Säulendiagramm: Vermögen im Altersvorsorgedepot pro Jahr, aufgeteilt in Einzahlungen, Förderung und Wertzuwachs"
        />
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-4">
          {[
            ["Einzahlungen", av.ownContributions],
            ["Zulagen", av.allowances],
            ["Investierte Steuerersparnis", av.investedTaxSavings],
            ["Wertzuwachs", av.gains],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-ink-2">{label}</dt>
              <dd className="font-semibold tabular-nums">
                {formatEuro(value as number)}
              </dd>
            </div>
          ))}
        </dl>
        {consumed > 0.5 && (
          <p className="mt-3 text-xs text-ink-2">
            {formatEuro(consumed)} Steuerersparnis werden nicht investiert und
            sind im Vermögen nicht enthalten.
          </p>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-accent">
            Jahreswerte als Tabelle
          </summary>
          <div className="mt-3">
            <YearTable result={result} />
          </div>
        </details>
      </Card>

      <Card>
        <h2 className="text-base font-semibold">Monatliche Netto-Rente</h2>
        <p className="mb-4 text-sm text-ink-2">
          Auszahlung von {input.retirementAge} bis {input.payoutUntilAge}, nach
          Steuern, ab dem zweiten Jahr.
        </p>
        <MonthlyPayoutBars
          av={av.payout.monthlyNet}
          normal={normal.payout.monthlyNet}
        />
      </Card>

      <Card>
        <h2 className="text-base font-semibold">Auszahlung im Detail</h2>
        <p className="mb-3 text-sm text-ink-2">
          Pro Jahr; das 1. Jahr enthält die Einmalauszahlung.
        </p>
        <PayoutTable result={result} />
      </Card>

      <Card>
        <h2 className="mb-2 text-base font-semibold">Annahmen</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
          <li>
            Einzahlungen erfolgen am Jahresende, Entnahmen zu Jahresbeginn; alle
            Beträge sind nominal, ohne Inflation.
          </li>
          <li>
            Beitragsjahre ab 2027, Einkommensteuer nach Grundtarif 2026 inklusive
            Solidaritätszuschlag, ohne Kirchensteuer.
          </li>
          <li>
            Kinderzulage bis zum 18. Geburtstag; Zulagen nur für Einzahlungen bis
            1.800 € pro Jahr.
          </li>
          <li>
            Der ETF-Sparplan läuft in einem kostenlosen Depot mit 30 %
            Teilfreistellung und Günstigerprüfung.
          </li>
          <li>
            Rechenweg nach der Dokumentation des Finanzfluss-Rechners. Keine
            Steuer- oder Anlageberatung.
          </li>
        </ul>
      </Card>
    </>
  );
}
