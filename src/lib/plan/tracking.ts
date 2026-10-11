/**
 * Verfolgen des Plans über die Zeit: eingefrorene Planversionen, erfasste
 * Ist-Stände und der Vergleich zwischen beiden.
 */
import {
  type PlanInput,
  type PlanResult,
  type PlanYear,
  type Pots,
  sumPots,
} from "./plan";

/** A plan frozen at a date: its inputs and what it showed then. Never changes. */
export interface PlanVersion {
  id: string;
  /** ISO date, e.g. "2026-10-11". */
  date: string;
  label: string;
  input: PlanInput;
  result: Pick<
    PlanResult,
    | "years"
    | "wealthAtRetirement"
    | "pension"
    | "probability"
    | "currentRate"
    | "requiredRate"
    | "status"
  >;
}

/** What was actually there at a date. */
export interface Snapshot {
  id: string;
  date: string;
  /** Balance of each pot at the date. */
  values: Pots;
  /** Paid into each pot since the previous snapshot (or the plan). */
  contributions: Pots;
  /** Actual inflation since the previous snapshot in percent per year, if known. */
  inflation: number | null;
  note: string;
  /** The forward-looking figures at the time of recording. */
  kpis: { probability: number; requiredRate: number; currentRate: number } | null;
}

/** Time between two ISO dates in years; the same day a year later is exactly 1. */
export function yearsBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  return (
    toYear - fromYear + (toMonth - fromMonth) / 12 + (toDay - fromDay) / 365.25
  );
}

const byDate = (a: { date: string }, b: { date: string }) =>
  a.date.localeCompare(b.date);

/** Snapshots taken after the version and up to (including) `until`, oldest first. */
function snapshotsSince(
  version: PlanVersion,
  snapshots: Snapshot[],
  until: string,
): Snapshot[] {
  return snapshots
    .filter((s) => s.date > version.date && s.date <= until)
    .sort(byDate);
}

/**
 * How much prices rose between the version and `date`. Uses the inflation
 * entered with each snapshot and the plan's assumption where none was entered.
 */
export function priceFactor(
  version: PlanVersion,
  snapshots: Snapshot[],
  date: string,
): number {
  let factor = 1;
  let from = version.date;
  for (const snapshot of snapshotsSince(version, snapshots, date)) {
    const rate = snapshot.inflation ?? version.input.inflationRate;
    factor *= (1 + rate / 100) ** yearsBetween(from, snapshot.date);
    from = snapshot.date;
  }
  return factor;
}

/** Value of a yearly path at a point between two years. */
function interpolate(
  years: PlanYear[],
  age: number,
  pick: (year: PlanYear) => number,
): number {
  const first = years[0].age;
  const position = Math.min(years.length - 1, Math.max(0, age - first));
  const lower = Math.floor(position);
  const upper = Math.min(years.length - 1, lower + 1);
  const share = position - lower;
  return pick(years[lower]) * (1 - share) + pick(years[upper]) * share;
}

export type CorridorPosition = "below" | "inside" | "above";

export interface Deviation {
  /** Years between the version and the snapshot. */
  years: number;
  /** Age on the version's time axis, for the chart. */
  age: number;
  /** Wealth the plan expected for this date and what is there, in the plan's money. */
  planned: number;
  actual: number;
  deviation: number;
  /** Part of the deviation from paying in more or less than planned. */
  contributionEffect: number;
  /** The rest: returns other than assumed (and subsidies, taxes, costs). */
  marketEffect: number;
  plannedContributions: number;
  actualContributions: number;
  position: CorridorPosition;
  /** Return actually earned per year since the version, in percent; null if not computable. */
  actualReturn: number | null;
  assumedReturn: number;
}

/** Compares a snapshot with what a frozen plan expected for that date. */
export function analyseDeviation(
  version: PlanVersion,
  snapshot: Snapshot,
  snapshots: Snapshot[],
): Deviation {
  const years = Math.max(0, yearsBetween(version.date, snapshot.date));
  const age = version.input.age + years;
  const prices = priceFactor(version, snapshots, snapshot.date);
  const path = version.result.years;

  const planned = interpolate(path, age, (y) => y.expected);
  const actual = sumPots(snapshot.values) / prices;

  const plannedContributions = sumPots(version.input.rates) * 12 * years;
  const actualContributions = snapshotsSince(version, snapshots, snapshot.date)
    .map((s) => sumPots(s.contributions))
    .reduce((sum, value) => sum + value, 0);
  const contributionEffect = (actualContributions - plannedContributions) / prices;
  const deviation = actual - planned;

  // Money-weighted return (modified Dietz): contributions count for half the time.
  const start = sumPots(version.input.values);
  const invested = start + actualContributions / 2;
  const gain = sumPots(snapshot.values) - start - actualContributions;
  const actualReturn =
    years > 0 && invested > 0 && gain / invested > -1
      ? ((1 + gain / invested) ** (1 / years) - 1) * 100
      : null;

  return {
    years,
    age,
    planned,
    actual,
    deviation,
    contributionEffect,
    marketEffect: deviation - contributionEffect,
    plannedContributions,
    actualContributions,
    position:
      actual < interpolate(path, age, (y) => y.p10)
        ? "below"
        : actual > interpolate(path, age, (y) => y.p90)
          ? "above"
          : "inside",
    actualReturn,
    assumedReturn: version.input.expectedReturn,
  };
}

/**
 * Today's plan, but with the assumptions a frozen version made. Comparing its
 * result with today's plan shows what changed assumptions alone do.
 */
export function withAssumptionsOf(
  current: PlanInput,
  version: PlanVersion,
): PlanInput {
  const frozen = version.input;
  return {
    ...current,
    inflationRate: frozen.inflationRate,
    expectedReturn: frozen.expectedReturn,
    retirementReturn: frozen.retirementReturn,
    cashReturn: frozen.cashReturn,
    capitalGainsTax: frozen.capitalGainsTax,
    depotVolatility: frozen.depotVolatility,
    cashVolatility: frozen.cashVolatility,
    avDepot:
      current.avDepot && frozen.avDepot
        ? {
            ...current.avDepot,
            etfReturnRate: frozen.avDepot.etfReturnRate,
            avDepotCosts: frozen.avDepot.avDepotCosts,
            payoutReturnRate: frozen.avDepot.payoutReturnRate,
          }
        : current.avDepot,
  };
}

/** The newest snapshot, or undefined when none was recorded yet. */
export function latestSnapshot(snapshots: Snapshot[]): Snapshot | undefined {
  return [...snapshots].sort(byDate).at(-1);
}
