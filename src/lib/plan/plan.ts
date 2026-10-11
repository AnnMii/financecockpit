/**
 * Gesamtplan: ein in sich stimmiger Vermögensplan über drei Töpfe
 * (Altersvorsorgedepot, ETF-Depot, Tagesgeld) bis zum Renteneintritt.
 *
 * Statt einer Linie liefert er einen Korridor: Viele zufällige Verläufe der
 * Rendite zeigen, in welchem Bereich das Vermögen landen kann, mit welcher
 * Wahrscheinlichkeit die Wunschrente erreicht wird und welche Sparrate für ein
 * gewähltes Sicherheitsniveau nötig ist.
 *
 * Alle Beträge sind in heutiger Kaufkraft. Das Modell und seine Grenzen:
 * - Renditen sind je Jahr unabhängig und lognormal verteilt, mit gleich
 *   bleibender Schwankung; AV-Depot und ETF-Depot bewegen sich gemeinsam.
 * - Sparraten bleiben in heutiger Kaufkraft gleich, steigen also mit der
 *   Inflation. Die Einzahlungen ins AV-Depot folgen dem AV-Depot-Rechner und
 *   bleiben nominal gleich.
 * - Die Rente aus dem AV-Depot wächst im Verhältnis zu dessen Kapital.
 * - Ab Renteneintritt wird mit der festen Rendite im Ruhestand gerechnet.
 */
import {
  type AvDepotInput,
  calculateAvDepot,
  validateAvDepotInput,
} from "@/lib/calculators/av-depot";
import type { CalculationError } from "@/lib/calculators/errors";
import {
  type PensionGapInput,
  calculatePensionGap,
  pensionGapRates,
  presentValueDue,
} from "@/lib/calculators/pension-gap";
import { createNormal, quantile } from "./random";

export interface Pots {
  av: number;
  depot: number;
  cash: number;
}

export const POTS = ["av", "depot", "cash"] as const;
export type Pot = (typeof POTS)[number];

export const sumPots = (pots: Pots) => pots.av + pots.depot + pots.cash;

export interface PlanInput {
  age: number;
  retirementAge: number;
  payoutUntilAge: number;
  /** All rates in percent per year, nominal. */
  inflationRate: number;
  expectedReturn: number;
  retirementReturn: number;
  cashReturn: number;
  capitalGainsTax: number;
  /** Yearly fluctuation (standard deviation) of the returns, in percent. */
  depotVolatility: number;
  cashVolatility: number;
  /** Pension entitlements and wish, as in the Rentenlücke calculator. */
  pension: Pick<
    PensionGapInput,
    | "statePension"
    | "companyPension"
    | "privatePension"
    | "riesterPension"
    | "taxPrediction"
    | "yearlyTaxFreeAmount"
    | "desiredPension"
  >;
  /** Savings per month into each pot, and what is in them today. */
  rates: Pots;
  values: Pots;
  /** Inputs of the AV-Depot calculator; null when nothing is paid into it. */
  avDepot: AvDepotInput | null;
  /** Share of courses in which the desired pension has to be reached, in percent. */
  confidenceTarget: number;
  /** Below / above these probabilities the plan asks for a change. */
  lowerGuardrail: number;
  upperGuardrail: number;
  /** Number of simulated courses and the seed of the random numbers. */
  paths?: number;
  seed?: number;
}

export interface Percentiles {
  /** Pessimistic: only 10 % of the courses end below. */
  p10: number;
  p50: number;
  /** Optimistic: only 10 % of the courses end above. */
  p90: number;
}

export interface PlanYear extends Percentiles {
  age: number;
  /** The course without any fluctuation. */
  expected: number;
}

export type PlanStatus = "increase" | "onTrack" | "room";

export interface PlanResult {
  /** Wealth of all pots from today (first entry) to retirement. */
  years: PlanYear[];
  wealthAtRetirement: Percentiles;
  /** Net pension per month from all sources. */
  pension: Percentiles;
  /** Net pension from the entitlements alone. */
  netPension: number;
  desiredPension: number;
  /** Share of courses that reach the desired pension, 0 to 1. */
  probability: number;
  /** What is saved per month today, and what the confidence target needs. */
  currentRate: number;
  requiredRate: number;
  status: PlanStatus;
  /** How much more to save ("increase") or how much could be saved less ("room"). */
  amount: number;
  /** Other ways back on track; only for the status "increase". */
  alternatives: {
    /** Lower the desired pension by this much per month. */
    lowerDesiredPensionBy: number;
    /** Retire this many years later; null if five years are not enough. */
    retireYearsLater: number | null;
  } | null;
}

const DEFAULT_PATHS = 2_000;
const DEFAULT_SEED = 20_261_011;
const MAX_YEARS_LATER = 5;

export function validatePlanInput(input: PlanInput): CalculationError[] {
  const errors: CalculationError[] = [];
  if (input.age >= input.retirementAge) errors.push("ageBeforeRetirement");
  if (input.payoutUntilAge <= input.retirementAge) {
    errors.push("payoutAfterRetirement");
  }
  if (input.rates.depot < 0) errors.push("planSharesOver100");
  if (
    input.lowerGuardrail >= input.confidenceTarget ||
    input.confidenceTarget >= input.upperGuardrail
  ) {
    errors.push("planGuardrailOrder");
  }
  if (input.avDepot) {
    for (const error of validateAvDepotInput(input.avDepot)) {
      if (!errors.includes(error)) errors.push(error);
    }
  }
  return errors;
}

export function calculatePlan(input: PlanInput): PlanResult {
  const result = simulate(input);
  if (result.status !== "increase") return result;

  let retireYearsLater: number | null = null;
  for (let years = 1; years <= MAX_YEARS_LATER; years++) {
    const later: PlanInput = {
      ...input,
      retirementAge: input.retirementAge + years,
      avDepot: input.avDepot && {
        ...input.avDepot,
        retirementAge: input.avDepot.retirementAge + years,
      },
    };
    if (validatePlanInput(later).length > 0) break;
    if (simulate(later).probability * 100 >= input.confidenceTarget) {
      retireYearsLater = years;
      break;
    }
  }
  return {
    ...result,
    alternatives: { ...result.alternatives!, retireYearsLater },
  };
}

function simulate(input: PlanInput): PlanResult {
  const paths = input.paths ?? DEFAULT_PATHS;
  const years = input.retirementAge - input.age;
  const inflation = input.inflationRate / 100;

  // --- What the wealth has to pay --------------------------------------
  const gapInput: PensionGapInput = {
    ...input.pension,
    age: input.age,
    retirementAge: input.retirementAge,
    payoutUntilAge: input.payoutUntilAge,
    currentCapital: 0,
    returnUntilRetirement: input.expectedReturn,
    retirementReturn: input.retirementReturn,
    considerInflation: true,
    inflationRate: input.inflationRate,
    capitalGainsTax: input.capitalGainsTax,
  };
  const { netPension } = calculatePensionGap(gapInput);
  const desiredPension = input.pension.desiredPension;
  const { payoutRate, savingRate } = pensionGapRates(gapInput);
  /** Capital that pays 1 € per month from retirement until the payout ends. */
  const capitalPerEuro = presentValueDue(
    1,
    payoutRate,
    (input.payoutUntilAge - input.retirementAge) * 12,
  );

  // --- Altersvorsorgedepot: nominal, following its calculator --------------
  const av = input.avDepot ? calculateAvDepot(input.avDepot) : null;
  const avGrowth = av
    ? 1 + (input.avDepot!.etfReturnRate - input.avDepot!.avDepotCosts) / 100
    : 1;
  const avInflows = av
    ? av.years.map((year, i) => {
        const before = av.years[i - 1]?.av;
        return (
          year.av.cumulativeOwnContributions +
          year.av.cumulativeSubsidies -
          (before
            ? before.cumulativeOwnContributions + before.cumulativeSubsidies
            : 0)
        );
      })
    : [];
  /** Net pension per euro of AV capital at retirement, in today's money. */
  const avPensionPerEuro =
    av && av.av.finalCapital > 0
      ? av.av.payout.monthlyNet / av.av.finalCapital / (1 + inflation) ** years
      : 0;

  // --- Depot and Tagesgeld: in today's money --------------------------------
  // Without an AV plan its balance is treated like the depot.
  const depotStart = input.values.depot + (av ? 0 : input.values.av);
  const depotGrowth = (1 + savingRate) ** 12;
  const cashGrowth = (1 + (input.cashReturn - input.inflationRate) / 100 / 12) ** 12;
  const depotSigma = input.depotVolatility / 100;
  const cashSigma = input.cashVolatility / 100;

  /** Value at the end of a year of 1 € paid in at the end of each month. */
  const monthlyDeposits = (growth: number) => {
    const monthly = growth ** (1 / 12) - 1;
    return Math.abs(monthly) < 1e-12 ? 12 : (growth - 1) / monthly;
  };

  // Per course: wealth that does not depend on the depot savings rate, and
  // what one euro of monthly depot savings grows to. The wealth is linear in
  // that rate, so the required rate needs no second simulation.
  const fixedWealth = new Float64Array(paths);
  const perDepotEuro = new Float64Array(paths);
  const avPension = new Float64Array(paths);
  const totals = Array.from({ length: years + 1 }, () => new Float64Array(paths));

  const course = (index: number, shocks: (() => number) | null) => {
    let avCapital = av ? input.values.av : 0;
    let depotFixed = depotStart;
    let depotPerEuro = 0;
    let cash = input.values.cash;
    totals[0][index] = avCapital + depotFixed + cash;

    for (let year = 1; year <= years; year++) {
      // Random factors with an expected value of 1; exactly 1 for the course
      // without fluctuation.
      const shock = (sigma: number, share = 1) =>
        shocks
          ? Math.exp(sigma * Math.sqrt(share) * shocks() - (sigma * sigma * share) / 2)
          : 1;
      const equity = shock(depotSigma);
      const depotFactor = depotGrowth * equity;
      const cashFactor = cashGrowth * shock(cashSigma);

      // Paid in over the year, the inflow is exposed for part of it: a third
      // of the yearly variance.
      avCapital =
        avCapital * avGrowth * equity +
        (avInflows[year - 1] ?? 0) * shock(depotSigma, 1 / 3);
      depotFixed *= depotFactor;
      depotPerEuro = depotPerEuro * depotFactor + monthlyDeposits(depotFactor);
      cash = cash * cashFactor + input.rates.cash * monthlyDeposits(cashFactor);

      totals[year][index] =
        avCapital / (1 + inflation) ** year +
        depotFixed +
        depotPerEuro * input.rates.depot +
        cash;
    }
    fixedWealth[index] = depotFixed + cash;
    perDepotEuro[index] = depotPerEuro;
    avPension[index] = avCapital * avPensionPerEuro;
  };

  // The course without fluctuation uses the last slot, then gets overwritten.
  course(0, null);
  const expected = totals.map((year) => year[0]);
  const normal = createNormal(input.seed ?? DEFAULT_SEED);
  for (let i = 0; i < paths; i++) course(i, normal);

  // --- Results --------------------------------------------------------------
  const pensions = new Float64Array(paths);
  const requiredDepotRates = new Float64Array(paths);
  let reached = 0;
  for (let i = 0; i < paths; i++) {
    const free = fixedWealth[i] + perDepotEuro[i] * input.rates.depot;
    pensions[i] = netPension + avPension[i] + free / capitalPerEuro;
    if (pensions[i] >= desiredPension - 1e-9) reached++;
    const missingCapital =
      (desiredPension - netPension - avPension[i]) * capitalPerEuro -
      fixedWealth[i];
    requiredDepotRates[i] = missingCapital / perDepotEuro[i];
  }
  pensions.sort();
  requiredDepotRates.sort();

  const percentiles = (values: Float64Array): Percentiles => {
    const sorted = values.slice().sort();
    return {
      p10: quantile(sorted, 0.1),
      p50: quantile(sorted, 0.5),
      p90: quantile(sorted, 0.9),
    };
  };

  const probability = reached / paths;
  const target = input.confidenceTarget / 100;
  const requiredDepotRate = Math.max(0, quantile(requiredDepotRates, target));
  const currentRate = sumPots(input.rates);
  const requiredRate = input.rates.av + input.rates.cash + requiredDepotRate;

  let status: PlanStatus = "onTrack";
  let amount = 0;
  if (probability * 100 < input.lowerGuardrail && requiredRate - currentRate >= 0.5) {
    status = "increase";
    amount = requiredRate - currentRate;
  } else if (
    probability * 100 > input.upperGuardrail &&
    currentRate - requiredRate >= 0.5
  ) {
    status = "room";
    amount = currentRate - requiredRate;
  }

  return {
    years: totals.map((year, i) => ({
      age: input.age + i,
      expected: expected[i],
      ...percentiles(year),
    })),
    wealthAtRetirement: percentiles(totals[years]),
    pension: {
      p10: quantile(pensions, 0.1),
      p50: quantile(pensions, 0.5),
      p90: quantile(pensions, 0.9),
    },
    netPension,
    desiredPension,
    probability,
    currentRate,
    requiredRate,
    status,
    amount,
    alternatives:
      status === "increase"
        ? {
            // The pension reached in the targeted share of courses.
            lowerDesiredPensionBy: Math.max(
              0,
              desiredPension - quantile(pensions, 1 - target),
            ),
            retireYearsLater: null,
          }
        : null,
  };
}
