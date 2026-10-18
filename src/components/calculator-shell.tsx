"use client";

import type { CalculationError } from "@/lib/calculators/errors";
import type { SettingsScope } from "@/lib/settings/schema";
import { DraftBar } from "./draft-settings";
import { Card } from "./fields";
import { useLocale } from "./locale-provider";
import { CalculatorProfiles } from "./profile-picker";

/**
 * Page frame every calculator shares: profile pickers and the input form on
 * the left, results (or the reasons why nothing can be calculated) on the
 * right, and the panel for unsaved local changes. Must sit inside
 * <DraftSettings>.
 */
export function CalculatorShell({
  scope,
  uses,
  form,
  errors,
  errorHint,
  children,
}: {
  scope: Exclude<SettingsScope, "shared">;
  /** Other scopes whose profiles the page reads; their pickers are shown too. */
  uses?: SettingsScope[];
  form: React.ReactNode;
  errors: CalculationError[];
  /** A way out that is not obvious from the errors themselves. */
  errorHint?: string | null;
  /** The results; shown when there are no errors. */
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <div className={`space-y-4 ${PANE} xl:z-20`}>
        <CalculatorProfiles scope={scope} uses={uses} />
        <Card className="space-y-7">{form}</Card>
      </div>

      <DraftBar />

      {errors.length === 0 ? (
        <div className={`min-w-0 space-y-5 ${PANE} xl:z-10`}>{children}</div>
      ) : (
        <Card className={`${PANE} xl:z-10`}>
          <h2 className="mb-2 text-base font-semibold">
            {t.common.cannotCalculate}
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-critical">
            {errors.map((error) => (
              <li key={error}>{t.calcErrors[error]}</li>
            ))}
          </ul>
          {errorHint && <p className="mt-3 text-sm text-ink-2">{errorHint}</p>}
        </Card>
      )}
    </div>
  );
}

/**
 * On wide screens the parameters and the results each scroll on their own, so
 * a long form does not push the charts out of sight and the other way round.
 * Each pane is a stacking context of its own (sticky); the form sits above
 * the results so its info panels are not painted behind the charts.
 */
const PANE =
  "xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-2";

export function Assumptions({ items }: { items: string[] }) {
  const { t } = useLocale();
  return (
    <Card>
      <h2 className="mb-2 text-base font-semibold">{t.common.assumptions}</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        <li>{t.common.noAdvice}</li>
      </ul>
    </Card>
  );
}

/** Collapsible table that repeats a chart's values. */
export function YearlyTable({
  head,
  rows,
}: {
  /** Column headings; the first column is left-aligned, the rest right. */
  head: string[];
  rows: (string | number)[][];
}) {
  const { t } = useLocale();
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm font-medium text-accent">
        {t.common.yearlyTable}
      </summary>
      <div className="mt-3 max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface text-xs text-ink-2">
            <tr className="border-b border-line">
              {head.map((heading, column) => (
                <th
                  key={heading}
                  className={`px-3 py-2 font-medium ${column === 0 ? "text-left" : "text-right"}`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-line last:border-0">
                {row.map((cell, column) => (
                  <td
                    key={column}
                    className={`px-3 py-1.5 tabular-nums ${column === 0 ? "" : "text-right"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
