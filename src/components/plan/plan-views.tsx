"use client";

import { useState } from "react";
import { type Corridor, CorridorChart } from "@/components/charts/corridor-chart";
import { Card } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { ToggleSetting } from "@/components/setting-fields";
import { useSettingsEditor } from "@/components/settings-provider";
import type { Locale } from "@/lib/i18n";
import type { PlanInput, PlanResult, PlanYear } from "@/lib/plan/plan";
import {
  type PlanVersion,
  type Snapshot,
  analyseDeviation,
} from "@/lib/plan/tracking";

/** Today's date here (not in Greenwich) as ISO date; stable for the lifetime of the component. */
export function useToday(): string {
  const [today] = useState(() => {
    const now = new Date();
    const two = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
  });
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
  const budget = input.budget;

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

      {budget !== undefined && (
        <p className="mt-3 text-xs text-ink-2">
          {t.budget.hint(f.euro(budget), f.euro(result.currentRate))}{" "}
          {Math.round(budget - result.currentRate) === 0
            ? t.budget.exact
            : budget > result.currentRate
              ? t.budget.free(f.euro(budget - result.currentRate))
              : t.budget.over(f.euro(result.currentRate - budget))}{" "}
          {budget >= result.requiredRate
            ? t.budget.enough(f.euro(budget), f.euro(budget - result.requiredRate))
            : t.budget.short(f.euro(budget), f.euro(result.requiredRate - budget))}
        </p>
      )}

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

/**
 * Where the pension comes from in the typical course: the entitlements, the
 * AV-Depot and the free assets, next to the wealth they start from.
 */
export function PlanBreakdown({
  input,
  result,
}: {
  input: PlanInput;
  result: PlanResult;
}) {
  const { t, f } = useLocale();
  const { settings } = useSettingsEditor();
  const text = t.plan.breakdown;
  // The plan works in today's money; the nominal view raises it with the
  // inflation until retirement, to sit next to the nominal calculators.
  const nominal = settings.plan.nominalView;
  const factor = nominal ? result.retirementPriceFactor : 1;
  const euro = (value: number) => f.euro(value * factor);
  const { typical } = result;
  const total = typical.statePension + typical.avPension + typical.freePension;
  const difference = total - result.desiredPension;
  const tax = typical.freePensionBeforeTax - typical.freePension;
  const consumes = input.capitalConsumption !== false;

  const row = (label: string, value: string, note?: string, strong = false) => (
    <div key={label} className="py-2">
      <div className="flex justify-between gap-4">
        <dt className={strong ? "font-medium" : "text-ink-2"}>{label}</dt>
        <dd className={`text-right tabular-nums ${strong ? "font-semibold" : ""}`}>
          {value}
        </dd>
      </div>
      {note && <p className="mt-0.5 text-xs text-ink-2">{note}</p>}
    </div>
  );

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{text.title}</h2>
          <p className="text-sm text-ink-2">
            {nominal
              ? text.subtitleNominal(f.percent((factor - 1) * 100))
              : text.subtitle}
          </p>
        </div>
        <div className="relative shrink-0">
          <ToggleSetting scope="plan" name="nominalView" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-2">
            {text.wealthTitle}
          </h3>
          <dl className="divide-y divide-line text-sm">
            {row(text.avDepot, euro(typical.avCapital))}
            {row(text.free, euro(typical.freeCapital))}
          </dl>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-2">
            {text.pensionTitle}
          </h3>
          <dl className="divide-y divide-line text-sm">
            {row(text.statePension, euro(typical.statePension))}
            {row(text.avPension, euro(typical.avPension))}
            {row(
              text.freePension,
              euro(typical.freePension),
              text.freeTax(euro(typical.freePensionBeforeTax), euro(tax)),
            )}
            {row(text.total, euro(total), undefined, true)}
            {row(
              text.desired,
              euro(result.desiredPension),
              difference >= 0
                ? text.surplus(euro(difference))
                : text.shortfall(euro(-difference)),
            )}
          </dl>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-2">
        {consumes ? text.consumes(input.payoutUntilAge) : text.keeps}{" "}
        {text.taxNote(f.percent(input.pension.taxPrediction))}
      </p>
    </Card>
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
