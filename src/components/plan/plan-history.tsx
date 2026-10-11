"use client";

import { useMemo, useState } from "react";
import { StackedColumns } from "@/components/charts/stacked-columns";
import { Card, NumberField, Section } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { useSettings } from "@/components/settings-provider";
import { toPlanInput } from "@/lib/calculators/registry";
import {
  POTS,
  type Pots,
  calculatePlan,
  sumPots,
  validatePlanInput,
} from "@/lib/plan/plan";
import {
  type PlanVersion,
  type Snapshot,
  analyseDeviation,
  withAssumptionsOf,
} from "@/lib/plan/tracking";
import { NO_BALANCES, usePlan, usePlanRecords } from "./plan-records";
import {
  VersionSelect,
  formatDate,
  useComparedVersion,
  useToday,
} from "./plan-views";

const AMOUNT = { min: 0, max: 1_000_000_000, default: 0 };

function PotFields({
  title,
  values,
  onChange,
}: {
  title: string;
  values: Pots;
  onChange: (values: Pots) => void;
}) {
  const { t } = useLocale();
  return (
    <Section title={title}>
      <div className="grid gap-4 sm:grid-cols-3">
        {POTS.map((pot) => (
          <NumberField
            key={pot}
            label={t.plan.pots[pot]}
            unit="€"
            spec={AMOUNT}
            value={values[pot]}
            onChange={(value) => onChange({ ...values, [pot]: value })}
          />
        ))}
      </div>
    </Section>
  );
}

/** Form to record what is in the pots at a date. */
function SnapshotForm() {
  const { t, f } = useLocale();
  const text = t.plan.history;
  const today = useToday();
  const { settings } = useSettings();
  const { snapshots, addSnapshot } = usePlanRecords();
  const previous = snapshots.at(-1);

  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Pots>(previous?.values ?? NO_BALANCES);
  const [contributions, setContributions] = useState<Pots>(NO_BALANCES);
  const [inflation, setInflation] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    setBusy(true);
    // The forward-looking figures as they are with these balances.
    const input = toPlanInput(settings, values);
    const plan = validatePlanInput(input).length === 0 ? calculatePlan(input) : null;
    const rate = f.parse(inflation);
    const stored = await addSnapshot({
      date,
      values,
      contributions,
      inflation: Number.isFinite(rate) ? rate : null,
      note: note.trim(),
      kpis: plan && {
        probability: plan.probability,
        requiredRate: plan.requiredRate,
        currentRate: plan.currentRate,
      },
    });
    setBusy(false);
    setFailed(!stored);
    if (stored) {
      setContributions(NO_BALANCES);
      setInflation("");
      setNote("");
    }
  };

  const inputClass =
    "w-full rounded-md border border-axis bg-surface px-3 py-2 text-sm text-ink";
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold">{text.formTitle}</h2>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label className="block max-w-48">
          <span className="mb-1 block text-sm font-medium">{text.date}</span>
          <input
            type="date"
            required
            max={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </label>
        <PotFields title={text.valuesTitle} values={values} onChange={setValues} />
        <PotFields
          title={text.contributionsTitle}
          values={contributions}
          onChange={setContributions}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{text.inflation}</span>
            <input
              inputMode="decimal"
              value={inflation}
              onChange={(event) => setInflation(event.target.value)}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-ink-2">{text.inflationHint}</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">{text.note}</span>
            <input
              maxLength={200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        {failed && (
          <p role="alert" className="text-xs text-critical">
            {t.plan.saveFailed}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {text.save}
        </button>
      </form>
    </Card>
  );
}

function SnapshotList() {
  const { locale, t, f } = useLocale();
  const text = t.plan.history;
  const { snapshots, removeSnapshot } = usePlanRecords();
  const cell = "px-3 py-2 text-right tabular-nums";

  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold">{text.listTitle}</h2>
      {snapshots.length === 0 ? (
        <p className="text-sm text-ink-2">{text.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-xs text-ink-2">
              <tr className="border-b border-line">
                <th className="px-3 py-2 text-left font-medium">{text.date}</th>
                {POTS.map((pot) => (
                  <th key={pot} className="px-3 py-2 text-right font-medium">
                    {t.plan.pots[pot]}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">{text.total}</th>
                <th className="px-3 py-2 text-right font-medium">
                  {text.contributions}
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((snapshot) => (
                <tr key={snapshot.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2">
                    {formatDate(locale, snapshot.date)}
                    {snapshot.note && (
                      <span className="block text-xs text-ink-2">{snapshot.note}</span>
                    )}
                  </td>
                  {POTS.map((pot) => (
                    <td key={pot} className={cell}>
                      {f.euro(snapshot.values[pot])}
                    </td>
                  ))}
                  <td className={`${cell} font-semibold`}>
                    {f.euro(sumPots(snapshot.values))}
                  </td>
                  <td className={cell}>{f.euro(sumPots(snapshot.contributions))}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void removeSnapshot(snapshot.id)}
                      className="rounded-md border border-axis px-2.5 py-1 text-xs text-ink hover:bg-accent-wash"
                    >
                      {t.plan.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Explains why the latest balance differs from what a frozen plan expected. */
function DeviationAnalysis({
  version,
  snapshot,
  snapshots,
}: {
  version: PlanVersion;
  snapshot: Snapshot;
  snapshots: Snapshot[];
}) {
  const { locale, t, f } = useLocale();
  const text = t.plan.history;
  const { input, result } = usePlan();
  const deviation = analyseDeviation(version, snapshot, snapshots);

  // The same balances and savings, once with the assumptions of the frozen plan.
  const withFrozenAssumptions = useMemo(() => {
    const replay = withAssumptionsOf(input, version);
    return validatePlanInput(replay).length === 0 ? calculatePlan(replay) : null;
  }, [input, version]);

  const signed = (value: number) => `${value > 0 ? "+" : ""}${f.euro(value)}`;
  const rows: [string, string, boolean][] = [
    [text.planned, f.euro(deviation.planned), false],
    [text.actual, f.euro(deviation.actual), false],
    [text.deviation, signed(deviation.deviation), true],
    [text.contributionEffect, signed(deviation.contributionEffect), false],
    [text.marketEffect, signed(deviation.marketEffect), false],
    [
      text.actualReturn,
      deviation.actualReturn === null ? "–" : f.percent(deviation.actualReturn),
      false,
    ],
    [text.assumedReturn, f.percent(deviation.assumedReturn), false],
  ];

  return (
    <>
      <p className="mb-3 text-sm text-ink-2">
        {text.analysisFor(formatDate(locale, snapshot.date), version.label)}
      </p>
      <p className="mb-3 text-sm font-semibold">{text.position[deviation.position]}</p>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([label, value, strong]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className={strong ? "font-medium" : "text-ink-2"}>{label}</dt>
            <dd className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</dd>
          </div>
        ))}
      </dl>
      {result && withFrozenAssumptions && (
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">{text.assumptionsTitle}</h3>
          <p className="mt-1 text-sm text-ink-2">
            {text.assumptionsNote(
              f.euro(withFrozenAssumptions.requiredRate),
              f.euro(result.requiredRate),
            )}
          </p>
        </div>
      )}
    </>
  );
}

export function PlanHistory() {
  const { locale, t, f } = useLocale();
  const text = t.plan.history;
  const { versions, snapshots } = usePlanRecords();
  const compared = useComparedVersion(versions);

  // The newest balance recorded after the compared plan was frozen.
  const version = compared.version;
  const snapshot = version && snapshots.filter((s) => s.date > version.date).at(-1);
  const withKpis = snapshots.filter((s) => s.kpis);

  return (
    <div className="max-w-4xl space-y-5">
      <SnapshotForm />
      <SnapshotList />

      <Card>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-semibold">{text.analysisTitle}</h2>
          <VersionSelect
            versions={versions}
            value={compared.id}
            onChange={compared.choose}
          />
        </div>
        {version && snapshot ? (
          <DeviationAnalysis
            version={version}
            snapshot={snapshot}
            snapshots={snapshots}
          />
        ) : (
          <p className="text-sm text-ink-2">{text.analysisEmpty}</p>
        )}
      </Card>

      {withKpis.length > 0 && (
        <Card>
          <h2 className="mb-4 text-base font-semibold">{text.rateChartTitle}</h2>
          <StackedColumns
            height={220}
            data={withKpis.map((s) => ({
              tick: s.date.slice(0, 4),
              title: formatDate(locale, s.date),
              values: { required: s.kpis!.requiredRate },
              compare: s.kpis!.currentRate,
            }))}
            series={[
              {
                key: "required",
                label: text.requiredSeries,
                color: "var(--series-1)",
              },
            ]}
            compareLabel={text.actualSeries}
            formatValue={f.euro}
            formatAxis={f.euroCompact}
            ariaLabel={text.rateChartAria}
          />
        </Card>
      )}
    </div>
  );
}
