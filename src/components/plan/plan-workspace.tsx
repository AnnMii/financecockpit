"use client";

import Link from "next/link";
import { useState } from "react";
import { Assumptions, CalculatorShell } from "@/components/calculator-shell";
import { DraftSettings } from "@/components/draft-settings";
import { Card, Section } from "@/components/fields";
import { useLocale } from "@/components/locale-provider";
import { NumberSetting, ToggleSetting } from "@/components/setting-fields";
import type { Percentiles, PlanInput, PlanResult } from "@/lib/plan/plan";
import type { PlanVersion } from "@/lib/plan/tracking";
import { usePlan, usePlanRecords } from "./plan-records";
import {
  PlanBreakdown,
  PlanCorridor,
  PlanStatus,
  VersionSelect,
  formatDate,
  useComparedVersion,
  useToday,
} from "./plan-views";

export function PlanWorkspace() {
  return (
    <DraftSettings>
      <Workspace />
    </DraftSettings>
  );
}

function Workspace() {
  const { locale, t, f } = useLocale();
  const text = t.plan;
  const { input, errors, result, snapshot } = usePlan();

  return (
    <CalculatorShell
      scope="plan"
      uses={["pension-gap", "av-depot", "withdrawal-plan"]}
      errors={errors}
      errorHint={
        errors.some((error) => error.startsWith("av")) ? text.avErrorHint : null
      }
      form={
        <>
          <Section title={text.sections.pension}>
            <NumberSetting scope="pension-gap" name="desiredPension" />
            <NumberSetting scope="pension-gap" name="statePension" />
            <NumberSetting scope="pension-gap" name="companyPension" />
            <NumberSetting scope="pension-gap" name="privatePension" />
            <NumberSetting scope="pension-gap" name="riesterPension" />
            <NumberSetting scope="pension-gap" name="taxPrediction" />
            <NumberSetting scope="pension-gap" name="yearlyTaxFreeAmount" />
            <p className="text-xs text-ink-2">{text.pensionNote}</p>
          </Section>

          <Section title={text.sections.balances}>
            {snapshot ? (
              <p className="text-sm text-ink">
                {text.balancesFrom(
                  formatDate(locale, snapshot.date),
                  f.euro(snapshot.values.av),
                  f.euro(snapshot.values.depot),
                  f.euro(snapshot.values.cash),
                )}{" "}
                <Link href="/verlauf" className="font-medium text-accent">
                  {text.changeInHistory}
                </Link>
              </p>
            ) : (
              <NumberSetting
                scope="shared"
                name="currentCapital"
                hint={text.capitalHint}
              />
            )}
          </Section>

          <Section title={text.sections.split}>
            <NumberSetting scope="shared" name="savingsRateMonthly" />
            <NumberSetting scope="plan" name="avDepotShare" />
            <NumberSetting scope="plan" name="cashShare" />
            <p className="text-xs text-ink-2">
              {text.splitSummary(
                f.euro(input.rates.av),
                f.euro(input.rates.depot),
                f.euro(input.rates.cash),
              )}
            </p>
          </Section>

          <Section title={text.sections.payout}>
            <ToggleSetting scope="withdrawal-plan" name="capitalConsumption" />
            <p className="text-xs text-ink-2">{text.payoutNote}</p>
          </Section>

          <Section title={text.sections.confidence}>
            <NumberSetting scope="plan" name="confidenceTarget" />
            <NumberSetting scope="plan" name="lowerGuardrail" />
            <NumberSetting scope="plan" name="upperGuardrail" />
          </Section>

          <Section title={text.sections.returns}>
            <NumberSetting scope="shared" name="expectedReturn" />
            <NumberSetting scope="plan" name="cashReturn" />
            <NumberSetting scope="shared" name="retirementReturn" />
            <NumberSetting scope="shared" name="inflationRate" />
            <NumberSetting scope="shared" name="capitalGainsTax" />
          </Section>

          <Section title={text.sections.volatility}>
            <NumberSetting scope="plan" name="depotVolatility" />
            <NumberSetting scope="plan" name="cashVolatility" />
          </Section>

          <Section title={text.sections.time}>
            <NumberSetting scope="shared" name="age" />
            <NumberSetting scope="shared" name="retirementAge" />
            <NumberSetting scope="shared" name="payoutUntilAge" />
          </Section>

          <p className="text-xs text-ink-2">{text.sourcesNote}</p>
        </>
      }
    >
      {result && <Results input={input} result={result} />}
    </CalculatorShell>
  );
}

function PercentileTiles({
  title,
  values,
  format,
}: {
  title: string;
  values: Percentiles;
  format: (value: number) => string;
}) {
  const { t } = useLocale();
  const rows: [string, number][] = [
    [t.plan.pessimistic, values.p10],
    [t.plan.expected, values.p50],
    [t.plan.optimistic, values.p90],
  ];
  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <dl className="grid grid-cols-3 gap-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-ink-2">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{format(value)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/** What the frozen plan showed, next to what the plan shows today. */
function ThenAndNow({
  version,
  result,
}: {
  version: PlanVersion;
  result: PlanResult;
}) {
  const { locale, t, f } = useLocale();
  const text = t.plan.thenNow;
  const then = version.result;
  const rows: [string, string, string][] = [
    [text.wealth, f.euro(then.wealthAtRetirement.p50), f.euro(result.wealthAtRetirement.p50)],
    [text.pension, f.euro(then.pension.p50), f.euro(result.pension.p50)],
    [
      text.probability,
      f.percent(Math.round(then.probability * 100)),
      f.percent(Math.round(result.probability * 100)),
    ],
    [text.requiredRate, f.euro(then.requiredRate), f.euro(result.requiredRate)],
  ];
  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold">{text.title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-ink-2">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 text-left font-medium" />
              <th className="px-3 py-2 text-right font-medium">
                {text.then} ({formatDate(locale, version.date)})
              </th>
              <th className="py-2 pl-3 text-right font-medium">{text.now}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, then, now]) => (
              <tr key={label} className="border-b border-line last:border-0">
                <th className="py-2 pr-3 text-left font-normal text-ink-2">{label}</th>
                <td className="px-3 py-2 text-right tabular-nums">{then}</td>
                <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                  {now}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function FreezeCard({ input, result }: { input: PlanInput; result: PlanResult }) {
  const { locale, t } = useLocale();
  const text = t.plan;
  const today = useToday();
  const { versions, addVersion, removeVersion } = usePlanRecords();
  const [label, setLabel] = useState(() =>
    text.freezeDefaultLabel(new Date().getFullYear()),
  );
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const freeze = async () => {
    setBusy(true);
    const stored = await addVersion({
      date: today,
      label: label.trim(),
      input,
      result: {
        years: result.years,
        wealthAtRetirement: result.wealthAtRetirement,
        pension: result.pension,
        probability: result.probability,
        currentRate: result.currentRate,
        requiredRate: result.requiredRate,
        status: result.status,
      },
    });
    setBusy(false);
    setFailed(!stored);
  };

  return (
    <Card>
      <h2 className="text-base font-semibold">{text.freezeTitle}</h2>
      <p className="mb-3 text-sm text-ink-2">{text.freezeIntro}</p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void freeze();
        }}
      >
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-xs font-medium text-ink-2">
            {text.freezeLabel}
          </span>
          <input
            required
            maxLength={60}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-md border border-axis bg-surface px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {text.freezeButton}
        </button>
      </form>
      {failed && (
        <p role="alert" className="mt-2 text-xs text-critical">
          {text.saveFailed}
        </p>
      )}

      <h3 className="mb-1 mt-5 text-sm font-semibold">{text.versionsTitle}</h3>
      {versions.length === 0 ? (
        <p className="text-sm text-ink-2">{text.noVersions}</p>
      ) : (
        <ul className="divide-y divide-line text-sm">
          {versions.map((version) => (
            <li key={version.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                {version.label}{" "}
                <span className="text-ink-2">
                  · {formatDate(locale, version.date)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void removeVersion(version.id)}
                className="rounded-md border border-axis px-2.5 py-1 text-xs text-ink hover:bg-accent-wash"
              >
                {text.delete}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Results({ input, result }: { input: PlanInput; result: PlanResult }) {
  const { t, f } = useLocale();
  const text = t.plan;
  const { versions, snapshots } = usePlanRecords();
  const compared = useComparedVersion(versions);

  return (
    <>
      <PlanStatus input={input} result={result} />

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{text.corridorTitle}</h2>
            <p className="max-w-xl text-sm text-ink-2">{text.corridorSubtitle}</p>
          </div>
          <VersionSelect
            versions={versions}
            value={compared.id}
            onChange={compared.choose}
          />
        </div>
        <PlanCorridor
          result={result}
          version={compared.version}
          snapshots={snapshots}
        />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PercentileTiles
          title={text.wealthAtRetirement}
          values={result.wealthAtRetirement}
          format={f.euro}
        />
        <PercentileTiles
          title={text.pensionPerMonth}
          values={result.pension}
          format={f.euro}
        />
      </div>

      {compared.version && (
        <ThenAndNow version={compared.version} result={result} />
      )}

      <PlanBreakdown input={input} result={result} />

      <FreezeCard input={input} result={result} />

      <Assumptions items={text.assumptions} />
    </>
  );
}
