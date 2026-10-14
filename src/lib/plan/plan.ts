/**
 * Overall plan: a consistent wealth plan over three pots
 * (Altersvorsorgedepot, ETF depot, savings account) until retirement.
 *
 * Instead of a single line it delivers a corridor: many random courses of the
 * return show the range the wealth can end up in, with what probability
 * the desired pension is reached and which savings rate a chosen
 * confidence level needs.
 *
 * All amounts are in today's purchasing power. The model and its limits:
 * - Returns are independent per year and lognormally distributed, with constant
 *   fluctuation; the AV-Depot and the ETF depot move together.
 * - Savings rates stay the same in today's purchasing power, so they rise with
 *   inflation. The contributions to the AV-Depot follow the AV-Depot calculator and
 *   bleiben nominal gleich.
 * - The pension from the AV-Depot grows in proportion to its capital.
 * - From retirement on the fixed return in retirement applies, after
 *   the estimated tax deduction; the free assets are either used up by the end
 *   of the payout or only their returns are withdrawn.
 * - The required savings rate is the total savings rate that, split over the
 *   pots in the same way, reaches the confidence level.
 */
import {
  AV_CONTRIBUTION_CAP,
  type AvDepotInput,
  MIN_OWN_CONTRIBUTION,
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

/** Shares of the savings rate in percent; the ETF-Depot gets the rest. */
export interface Shares {
  av: number;
  cash: number;
}

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
  /** Pension entitlements and wish, as in the pension gap calculator. */
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
  /** What can be invested per month in all; the rates are compared with it. */
  budget?: number;
  /** Running costs of the ETF depot per year in percent, on top of its fund costs. */
  depotCosts?: number;
  /**
   * How the savings rate is split, as entered; `rates` follows from it (see
   * `splitSavingsRate`). Plans frozen before the shares were stored lack them.
   */
  shares?: Shares;
  /**
   * Inputs of the AV-Depot calculator, used while something is paid into it
   * (`rates.av` above 0). null in a plan that knows no AV-Depot.
   */
  avDepot: AvDepotInput | null;
  /**
   * Whether the free capital (ETF-Depot and Tagesgeld) is used up by the end
   * of the payout; otherwise only its returns are paid out. Plans frozen
   * before this was stored used it up.
   */
  capitalConsumption?: boolean;
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

/**
 * The typical course (the one with the median pension) broken down by source.
 * Wealth at retirement and pensions per month, all in today's money.
 */
export interface TypicalCourse {
  avCapital: number;
  /** ETF-Depot and Tagesgeld together. */
  freeCapital: number;
  /** Net pension from the entitlements alone. */
  statePension: number;
  /** Net pension from the AV-Depot. */
  avPension: number;
  /** What the free capital pays per month, after tax and before it. */
  freePension: number;
  freePensionBeforeTax: number;
}

export interface PlanResult {
  /** Wealth of all pots from today (first entry) to retirement. */
  years: PlanYear[];
  wealthAtRetirement: Percentiles;
  /** Net pension per month from all sources. */
  pension: Percentiles;
  /** Net pension from the entitlements alone. */
  netPension: number;
  desiredPension: number;
  typical: TypicalCourse;
  /** How much prices have risen by retirement; today's money times this is future euros. */
  retirementPriceFactor: number;
  /** Share of courses that reach the desired pension, 0 to 1. */
  probability: number;
  /**
   * What is saved per month today, and the total savings rate that reaches
   * the confidence target when it is split over the pots in the same way.
   */
  currentRate: number;
  requiredRate: number;
  status: PlanStatus;
  /** How much more to save ("increase") or how much could be saved less ("room"). */
  amount: number;
  /** Other ways back on track; only for the status "increase". */
  alternatives: {
    /** Lower the desired pension by this much per month. */
    lowerDesiredPensionBy: number;
    /** Retire this many years later; null if that is not possible or not enough. */
    retireYearsLater: number | null;
  } | null;
}

const DEFAULT_PATHS = 2_000;
const DEFAULT_SEED = 20_261_011;
const MAX_YEARS_LATER = 5;
const HINT_PATHS = 500;

/**
 * Splits a monthly savings rate over the pots. The AV-Depot only takes
 * between its minimum and its maximum contribution; what it cannot take goes
 * to the ETF-Depot. Shares above 100 % leave the depot negative, which
 * `validatePlanInput` reports.
 */
export function splitSavingsRate(
  total: number,
  shares: Shares,
  withAvDepot = true,
): Pots {
  const wanted = (total * shares.av) / 100;
  const cash = (total * shares.cash) / 100;
  const rest = total - wanted - cash;
  // Rounding alone must not turn "exactly 100 %" into "above 100 %".
  if (rest < -1e-9 * Math.max(1, total)) return { av: wanted, depot: rest, cash };

  const av =
    !withAvDepot || wanted * 12 < MIN_OWN_CONTRIBUTION
      ? 0
      : Math.min(wanted, AV_CONTRIBUTION_CAP / 12);
  return { av, depot: Math.max(0, rest) + (wanted - av), cash };
}

/** Whether the plan pays into an AV-Depot. */
export function hasAvDepot(input: PlanInput): boolean {
  return input.avDepot !== null && input.rates.av > 0;
}

/** The same plan with another total savings rate, split over the pots as before. */
export function withSavingsRate(input: PlanInput, total: number): PlanInput {
  const current = sumPots(input.rates);
  const shares =
    input.shares ??
    (current > 0
      ? {
          av: (input.rates.av / current) * 100,
          cash: (input.rates.cash / current) * 100,
        }
      : { av: 0, cash: 0 });
  const rates = splitSavingsRate(total, shares, input.avDepot !== null);
  return {
    ...input,
    rates,
    avDepot: input.avDepot && { ...input.avDepot, savingsRate: rates.av * 12 },
  };
}

export function validatePlanInput(input: PlanInput): CalculationError[] {
  const errors: CalculationError[] = [];
  if (input.age >= input.retirementAge) errors.push("ageBeforeRetirement");
  if (input.payoutUntilAge <= input.retirementAge) {
    errors.push("payoutAfterRetirement");
  }
  if (input.rates.depot < 0) errors.push("planSharesOver100");
  // Without using the capital up there has to be a return to live from.
  const afterTaxReturn =
    (input.retirementReturn - input.inflationRate) *
    (1 - input.pension.taxPrediction / 100);
  if (input.capitalConsumption === false && afterTaxReturn <= 0) {
    errors.push("needsInterest");
  }
  if (
    input.lowerGuardrail >= input.confidenceTarget ||
    input.confidenceTarget >= input.upperGuardrail
  ) {
    errors.push("planGuardrailOrder");
  }
  if (hasAvDepot(input)) {
    for (const error of validateAvDepotInput(input.avDepot!)) {
      if (!errors.includes(error)) errors.push(error);
    }
  }
  return errors;
}

export function calculatePlan(input: PlanInput): PlanResult {
  const paths = input.paths ?? DEFAULT_PATHS;
  const frame = frameOf(input);
  const { courses, totals, expected } = simulate(input, frame, paths);

  // --- Pension per course and the share that reaches the wish ---------------
  const parts = newParts(paths);
  const probability = reached(input, frame, courses, parts) / paths;
  const median = Math.min(paths - 1, Math.max(0, Math.ceil(0.5 * paths) - 1));
  const typicalIndex = Array.from({ length: paths }, (_, i) => i).sort(
    (a, b) => parts.pensions[a] - parts.pensions[b],
  )[median];
  const typicalFree = parts.freeCapital[typicalIndex];
  const pensions = parts.pensions.slice().sort();

  // --- The savings rate the confidence target needs -------------------------
  const target = input.confidenceTarget / 100;
  const reaches = (total: number) =>
    reached(withSavingsRate(input, total), frame, courses) >=
    Math.ceil(target * paths - 1e-9);
  const currentRate = sumPots(input.rates);
  const requiredRate = smallest(reaches, Math.max(100, 2 * currentRate));

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

  const percentiles = (values: Float64Array): Percentiles => {
    const sorted = values.slice().sort();
    return {
      p10: quantile(sorted, 0.1),
      p50: quantile(sorted, 0.5),
      p90: quantile(sorted, 0.9),
    };
  };

  return {
    years: totals.map((year, i) => ({
      age: input.age + i,
      expected: expected[i],
      ...percentiles(year),
    })),
    wealthAtRetirement: percentiles(totals[frame.years]),
    pension: {
      p10: quantile(pensions, 0.1),
      p50: quantile(pensions, 0.5),
      p90: quantile(pensions, 0.9),
    },
    netPension: frame.netPension,
    desiredPension: frame.desiredPension,
    typical: {
      avCapital: parts.avCapital[typicalIndex],
      freeCapital: typicalFree,
      statePension: frame.netPension,
      avPension: parts.avPension[typicalIndex],
      freePension: typicalFree / frame.capitalPerEuro,
      freePensionBeforeTax: typicalFree / frame.capitalPerEuroBeforeTax,
    },
    retirementPriceFactor: frame.deflator,
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
              frame.desiredPension - quantile(pensions, 1 - target),
            ),
            retireYearsLater: yearsLaterThatSuffice(input, paths),
          }
        : null,
  };
}

/** After how many more years of work the confidence target is reached, if at all. */
function yearsLaterThatSuffice(input: PlanInput, paths: number): number | null {
  // A rough hint, and up to five more simulations: fewer courses are enough.
  const few = Math.min(paths, HINT_PATHS);
  for (let years = 1; years <= MAX_YEARS_LATER; years++) {
    const later: PlanInput = {
      ...input,
      retirementAge: input.retirementAge + years,
      avDepot: input.avDepot && {
        ...input.avDepot,
        retirementAge: input.avDepot.retirementAge + years,
      },
    };
    if (validatePlanInput(later).length > 0) return null;
    const frame = frameOf(later);
    const { courses } = simulate(later, frame, few);
    if ((reached(later, frame, courses) / few) * 100 >= input.confidenceTarget) {
      return years;
    }
  }
  return null;
}

/**
 * The smallest value of at least 0 for which `reaches` holds; `reaches` must
 * stay true for everything above. `guess` is where the search starts looking
 * for an upper end.
 */
function smallest(reaches: (value: number) => boolean, guess: number): number {
  if (reaches(0)) return 0;
  let low = 0;
  let high = guess;
  for (let doubling = 0; !reaches(high); doubling++) {
    if (doubling === 40) return high;
    low = high;
    high *= 2;
  }
  for (let i = 0; i < 100 && high - low > 1e-10 * Math.max(1, high); i++) {
    const middle = (low + high) / 2;
    if (reaches(middle)) high = middle;
    else low = middle;
  }
  return high;
}

/** What the plan rests on, whatever is saved. */
interface Frame {
  /** Years until retirement. */
  years: number;
  inflation: number;
  netPension: number;
  desiredPension: number;
  /**
   * Capital that pays 1 € per month from retirement, after tax and before it.
   * Infinite when only the returns are paid out and there are none.
   */
  capitalPerEuro: number;
  capitalPerEuroBeforeTax: number;
  /** Today's money per euro of the AV-Depot at retirement. */
  deflator: number;
  /** Yearly growth without fluctuation: AV-Depot nominal, the others in today's money. */
  avGrowth: number;
  depotGrowth: number;
  cashGrowth: number;
}

function frameOf(input: PlanInput): Frame {
  const gapInput: PensionGapInput = {
    ...input.pension,
    age: input.age,
    retirementAge: input.retirementAge,
    payoutUntilAge: input.payoutUntilAge,
    currentCapital: 0,
    returnUntilRetirement: input.expectedReturn - (input.depotCosts ?? 0),
    retirementReturn: input.retirementReturn,
    considerInflation: true,
    inflationRate: input.inflationRate,
    capitalGainsTax: input.capitalGainsTax,
  };
  const { payoutRate, savingRate } = pensionGapRates(gapInput);
  const consumes = input.capitalConsumption !== false;
  const months = (input.payoutUntilAge - input.retirementAge) * 12;
  const years = input.retirementAge - input.age;
  return {
    years,
    inflation: input.inflationRate / 100,
    netPension: calculatePensionGap(gapInput).netPension,
    desiredPension: input.pension.desiredPension,
    capitalPerEuro: capitalPerEuro(payoutRate, months, consumes),
    capitalPerEuroBeforeTax: capitalPerEuro(
      (input.retirementReturn - input.inflationRate) / 100 / 12,
      months,
      consumes,
    ),
    deflator: (1 + input.inflationRate / 100) ** years,
    avGrowth: input.avDepot
      ? 1 + (input.avDepot.etfReturnRate - input.avDepot.avDepotCosts) / 100
      : 1,
    depotGrowth: (1 + savingRate) ** 12,
    cashGrowth: (1 + (input.cashReturn - input.inflationRate) / 100 / 12) ** 12,
  };
}

/**
 * Capital that pays 1 € per month for `months` months at a monthly rate, or,
 * without using it up, for ever from the interest alone.
 */
function capitalPerEuro(
  monthlyRate: number,
  months: number,
  consumes: boolean,
): number {
  if (consumes) return presentValueDue(1, monthlyRate, months);
  return monthlyRate > 0 ? 1 / monthlyRate : Number.POSITIVE_INFINITY;
}

/** The AV-Depot of a plan: nominal, following its calculator. */
function avDepotOf(input: PlanInput, frame: Frame) {
  if (!hasAvDepot(input)) return null;
  const av = calculateAvDepot(input.avDepot!);
  return {
    /** Paid in per year: own contributions, allowances and invested tax savings. */
    inflows: av.years.map((year, i) => {
      const before = av.years[i - 1]?.av;
      return (
        year.av.cumulativeOwnContributions +
        year.av.cumulativeSubsidies -
        (before
          ? before.cumulativeOwnContributions + before.cumulativeSubsidies
          : 0)
      );
    }),
    /** Net pension per euro of AV capital at retirement, in today's money. */
    pensionPerEuro:
      av.av.finalCapital > 0
        ? av.av.payout.monthlyNet /
          av.av.finalCapital /
          (1 + frame.inflation) ** frame.years
        : 0,
  };
}

/**
 * The random part of the plan: per course, what one euro is worth at
 * retirement. It does not depend on how much is saved, so other savings rates
 * can be tried on the same courses.
 */
interface Courses {
  /** 1 € that is in the pot today. */
  avStart: Float64Array;
  depotStart: Float64Array;
  cashStart: Float64Array;
  /** 1 € paid into the AV-Depot during a year; `years` entries per course. */
  avInflow: Float64Array;
  /** 1 € paid in at the end of every month until retirement. */
  depotPerEuro: Float64Array;
  cashPerEuro: Float64Array;
}

/** Value at the end of a year of 1 € paid in at the end of each month. */
function monthlyDeposits(growth: number): number {
  const monthly = growth ** (1 / 12) - 1;
  return Math.abs(monthly) < 1e-12 ? 12 : (growth - 1) / monthly;
}

/** Runs the courses: the wealth of every year for this plan, and what a euro grows to. */
function simulate(input: PlanInput, frame: Frame, paths: number) {
  const { years, inflation } = frame;
  const av = avDepotOf(input, frame);
  // Without an AV plan its balance is treated like the depot.
  const avBalance = av ? input.values.av : 0;
  const depotBalance = input.values.depot + (av ? 0 : input.values.av);
  const depotSigma = input.depotVolatility / 100;
  const cashSigma = input.cashVolatility / 100;
  // Paid in over the year, an inflow is exposed for part of it: a third of
  // the yearly variance.
  const inflowSigma = depotSigma * Math.sqrt(1 / 3);
  const deflators = Array.from(
    { length: years + 1 },
    (_, year) => (1 + inflation) ** year,
  );

  const courses: Courses = {
    avStart: new Float64Array(paths),
    depotStart: new Float64Array(paths),
    cashStart: new Float64Array(paths),
    avInflow: new Float64Array(paths * years),
    depotPerEuro: new Float64Array(paths),
    cashPerEuro: new Float64Array(paths),
  };
  const totals = Array.from({ length: years + 1 }, () => new Float64Array(paths));
  const expected = new Array<number>(years + 1);
  const avFactors = new Float64Array(years);
  const inflowShocks = new Float64Array(years);

  /** One course; without `shocks` the one without fluctuation. */
  const course = (
    shocks: (() => number) | null,
    record: (year: number, wealth: number) => void,
    index: number | null,
  ) => {
    let avCapital = avBalance;
    let depotFixed = depotBalance;
    let depotPerEuro = 0;
    let cash = input.values.cash;
    let depotStart = 1;
    let cashStart = 1;
    let cashPerEuro = 0;
    record(0, avCapital + depotFixed + cash);

    // Random factors with an expected value of 1; exactly 1 for the course
    // without fluctuation.
    const shock = (sigma: number, variance: number) =>
      shocks ? Math.exp(sigma * shocks() - variance / 2) : 1;

    for (let year = 1; year <= years; year++) {
      const equity = shock(depotSigma, depotSigma * depotSigma);
      const depotFactor = frame.depotGrowth * equity;
      const cashFactor = frame.cashGrowth * shock(cashSigma, cashSigma * cashSigma);
      const inflowShock = shock(inflowSigma, (depotSigma * depotSigma) / 3);
      const cashDeposits = monthlyDeposits(cashFactor);

      avCapital =
        avCapital * frame.avGrowth * equity +
        (av?.inflows[year - 1] ?? 0) * inflowShock;
      depotFixed *= depotFactor;
      depotPerEuro = depotPerEuro * depotFactor + monthlyDeposits(depotFactor);
      cash = cash * cashFactor + input.rates.cash * cashDeposits;
      record(
        year,
        avCapital / deflators[year] +
          depotFixed +
          depotPerEuro * input.rates.depot +
          cash,
      );

      avFactors[year - 1] = frame.avGrowth * equity;
      inflowShocks[year - 1] = inflowShock;
      depotStart *= depotFactor;
      cashStart *= cashFactor;
      cashPerEuro = cashPerEuro * cashFactor + cashDeposits;
    }

    if (index === null) return;
    // An inflow grows with every year that follows the one it was paid in.
    let growth = 1;
    for (let year = years - 1; year >= 0; year--) {
      courses.avInflow[index * years + year] = inflowShocks[year] * growth;
      growth *= avFactors[year];
    }
    courses.avStart[index] = growth;
    courses.depotStart[index] = depotStart;
    courses.cashStart[index] = cashStart;
    courses.depotPerEuro[index] = depotPerEuro;
    courses.cashPerEuro[index] = cashPerEuro;
  };

  course(null, (year, wealth) => (expected[year] = wealth), null);
  const normal = createNormal(input.seed ?? DEFAULT_SEED);
  for (let i = 0; i < paths; i++) {
    course(normal, (year, wealth) => (totals[year][i] = wealth), i);
  }
  return { courses, totals, expected };
}

/** The result of every course, in the order of the courses. */
interface CourseParts {
  pensions: Float64Array;
  avPension: Float64Array;
  /** At retirement, in today's money. */
  avCapital: Float64Array;
  freeCapital: Float64Array;
}

const newParts = (paths: number): CourseParts => ({
  pensions: new Float64Array(paths),
  avPension: new Float64Array(paths),
  avCapital: new Float64Array(paths),
  freeCapital: new Float64Array(paths),
});

/**
 * In how many courses the plan reaches the desired pension. Fills `parts`
 * with the pension and its sources of every course when given.
 */
function reached(
  input: PlanInput,
  frame: Frame,
  courses: Courses,
  parts?: CourseParts,
): number {
  const av = avDepotOf(input, frame);
  const avBalance = av ? input.values.av : 0;
  const depotBalance = input.values.depot + (av ? 0 : input.values.av);
  const years = Math.min(frame.years, av?.inflows.length ?? 0);
  const paths = courses.depotStart.length;

  let count = 0;
  for (let i = 0; i < paths; i++) {
    let avCapital = avBalance * courses.avStart[i];
    for (let year = 0; year < years; year++) {
      avCapital += av!.inflows[year] * courses.avInflow[i * frame.years + year];
    }
    const free =
      depotBalance * courses.depotStart[i] +
      input.rates.depot * courses.depotPerEuro[i] +
      input.values.cash * courses.cashStart[i] +
      input.rates.cash * courses.cashPerEuro[i];
    const avPension = avCapital * (av?.pensionPerEuro ?? 0);
    const pension = frame.netPension + avPension + free / frame.capitalPerEuro;
    if (parts) {
      parts.pensions[i] = pension;
      parts.avPension[i] = avPension;
      parts.avCapital[i] = avCapital / frame.deflator;
      parts.freeCapital[i] = free;
    }
    if (pension >= frame.desiredPension - 1e-9) count++;
  }
  return count;
}
