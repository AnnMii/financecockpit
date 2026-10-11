"use client";

import { useState } from "react";
import { type Corridor, CorridorChart } from "@/components/charts/corridor-chart";
import { Card } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import type { PlanInput, PlanResult, PlanYear } from "@/lib/plan/plan";
import {
  type PlanVersion,
  type Snapshot,
  analyseDeviation,
} from "@/lib/plan/tracking";

/** Today as ISO date; stable for the lifetime of the component. */
export function useToday(): string {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  return today;
}

/** "2026-10-11" -> "11.10.2026" / "Oct 11, 2026" */
export function formatDate(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

const STATUS_COLOR = {
  increase: "var(--critical)",
  onTrack: "var(--good)",
  room: "var(--accent)",
};

/**
 * The answer to "am I saving enough?": the guardrail status, the probability
 * of reaching the desired pension, and required against actual savings rate.
 */
export function PlanStatus({
  input,
  result,
}: {
  input: PlanInput;
  result: PlanResult;
}) {
  const { t, f } = useLocale();
  const text = t.plan;
  const percent = (value: number) => f.percent(value);
  const amount = f.euro(result.amount);

  return (
    <Card>
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span
          aria-hidden="true"
          className="inline-block size-2.5 rounded-full"
          style={{ background: STATUS_COLOR[result.status] }}
        />
        {text.status[result.status]}
      </p>
      <p className="mt-2 text-5xl font-semibold">
        {percent(Math.round(result.probability * 100))}
      </p>
      <p className="mt-1 text-sm text-ink-2">{text.probability}</p>
      <p className="mt-1 text-xs text-ink-2">
        {text.guardrails(
          percent(input.lowerGuardrail),
          percent(input.confidenceTarget),
          percent(input.upperGuardrail),
        )}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <dt className="text-xs text-ink-2">{text.currentRate}</dt>
          <dd className="text-2xl font-semibold">{f.euro(result.currentRate)}</dd>
          <dd className="text-xs text-ink-2">{t.common.perMonth}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-2">{text.requiredRate}</dt>
          <dd className="text-2xl font-semibold">{f.euro(result.requiredRate)}</dd>
          <dd className="text-xs text-ink-2">
            {text.requiredRateNote(percent(input.confidenceTarget))}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-ink">
        {result.status === "increase"
          ? text.statusNote.increase(amount)
          : result.status === "room"
            ? text.statusNote.room(amount)
            : text.statusNote.onTrack}
      </p>

      {result.alternatives && (
        <div className="mt-3 text-sm text-ink-2">
          <p className="font-medium text-ink">{text.alternativesTitle}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              {text.lowerPension(f.euro(result.alternatives.lowerDesiredPensionBy))}
            </li>
            <li>
              {result.alternatives.retireYearsLater === null
                ? text.retireLaterNotEnough
                : text.retireLater(f.years(result.alternatives.retireYearsLater))}
            </li>
          </ul>
        </div>
      )}
    </Card>
  );
}

const toPoints = (years: PlanYear[]): Corridor["points"] =>
  years.map((year) => ({
    x: year.age,
    low: year.p10,
    mid: year.p50,
    high: year.p90,
  }));

/**
 * Wealth until retirement as a corridor. With a frozen version it also shows
 * that version's corridor and the recorded balances since then.
 */
export function PlanCorridor({
  result,
  version,
  snapshots = [],
  height,
}: {
  result: PlanResult;
  version?: PlanVersion;
  snapshots?: Snapshot[];
  height?: number;
}) {
  const { locale, t, f } = useLocale();
  const text = t.plan;

  const corridors: Corridor[] = [];
  if (version) {
    corridors.push({
      key: "frozen",
      label: text.frozen(version.label),
      color: "var(--series-compare)",
      points: toPoints(version.result.years),
    });
  }
  corridors.push({
    key: "forecast",
    label: text.forecast,
    color: "var(--series-1)",
    points: toPoints(result.years),
  });

  const markers = version && {
    label: text.snapshots,
    color: "var(--series-2)",
    items: snapshots
      .filter((snapshot) => snapshot.date > version.date)
      .map((snapshot) => {
        const deviation = analyseDeviation(version, snapshot, snapshots);
        return {
          x: deviation.age,
          y: deviation.actual,
          title: text.snapshotOn(formatDate(locale, snapshot.date)),
        };
      }),
  };

  return (
    <CorridorChart
      corridors={corridors}
      markers={markers}
      rangeLabel={text.range}
      formatX={(age) => t.common.ageN(age)}
      formatValue={f.euro}
      formatAxis={f.euroCompact}
      ariaLabel={text.corridorAria}
      height={height}
    />
  );
}

/** Dropdown to pick the frozen plan to compare with. */
export function VersionSelect({
  versions,
  value,
  onChange,
}: {
  versions: PlanVersion[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { locale, t } = useLocale();
  if (versions.length === 0) return null;
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
      {t.plan.compareWith}
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-md border border-axis bg-surface px-2 py-1 text-sm text-ink"
      >
        <option value="">{t.plan.noComparison}</option>
        {versions.map((version) => (
          <option key={version.id} value={version.id}>
            {version.label} ({formatDate(locale, version.date)})
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Which frozen plan is compared: the chosen one, by default the newest.
 * Returns the id for the select, the version itself and the setter.
 */
export function useComparedVersion(versions: PlanVersion[]) {
  // undefined: nothing chosen yet, follow the newest version.
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const id = chosen === undefined ? (versions.at(-1)?.id ?? null) : chosen;
  const version = versions.find((v) => v.id === id);
  return { id: version ? id : null, version, choose: setChosen };
}
