/**
 * Savings calculator: from starting capital, savings rate, interest rate,
 * duration and final capital the fifth figure is calculated, with capital gains tax on request.
 *
 * Own implementation that follows the Finanzfluss calculator
 * (https://www.finanzfluss.de/rechner/sparrechner/). The original is a
 * submodule under vendor/finanzfluss-calculators;
 * test/upstream/savings.parity.test.ts compares the two.
 *
 * Unlike the original, which has a formula of its own for each figure, only
 * the final capital is calculated as a formula here; the other four figures
 * follow from a search for the value that leads to the desired final capital.
 */

import type { CalculationError } from "./errors";

export type SavingsOutput =
  | "endValue"
  | "startValue"
  | "yearlyInterest"
  | "duration"
  | "savingRate";
export type SaveInterval = "monthly" | "yearly";
export type InterestInterval = "monthly" | "quarterly" | "yearly";
export type DistributionType = "distributing" | "accumulating";

export interface SavingsInput {
  /** The searched figure; its input value is ignored. */
  output: SavingsOutput;
  startValue: number;
  /** Deposit per saving interval, at the start of the interval. */
  savingRate: number;
  saveInterval: SaveInterval;
  /** Interest rate per year in percent, before the costs. */
  yearlyInterest: number;
  /** Running costs per year in percent, e.g. a custody fee; they reduce the interest rate. */
  costs?: number;
  /**
   * Inflation rate in percent that is deducted from the interest rate: the deposits
   * then stay the same in today's purchasing power and the result is in today's euros.
   */
  inflation?: number;
  interestInterval: InterestInterval;
  durationYears: number;
  endValue: number;
  considerTax: boolean;
  /** Capital gains tax in percent. */
  capitalGainsTax: number;
  /** Distributing: interest is taxed as it is paid. Accumulating: at the end. */
  distributionType: DistributionType;
  /** Partial exemption (Teilfreistellung) in percent; 0 when it is not taken into account. */
  partialExemption: number;
}

export interface SavingsResult {
  startValue: number;
  savingRate: number;
  yearlyInterest: number;
  durationYears: number;
  endValue: number;
  /** Starting capital plus all deposits. */
  deposits: number;
  /** Interest after taxes. */
  interest: number;
  /** Balance at the end of each year; the last year may be a fraction. */
  years: { year: number; deposits: number; interest: number }[];
  /**
   * The desired final capital is already reached when the searched figure is
   * 0. The result is then this plan with 0, and `endValue` is what it
   * reaches. Only the starting capital goes below 0 instead, like at
   * Finanzfluss: the negative amount that makes the end value hit the target.
   */
  alreadyReached: boolean;
}

type Plan = Omit<SavingsInput, "output" | "endValue">;

const round2 = (value: number) => Math.round(value * 100) / 100;

function depositsOf(plan: Plan): number {
  const perYear = plan.saveInterval === "monthly" ? 12 : 1;
  return plan.startValue + plan.savingRate * plan.durationYears * perYear;
}

/** Final capital after taxes. */
function endValueOf(plan: Plan): number {
  const taxShare =
    (plan.capitalGainsTax / 100) * (1 - plan.partialExemption / 100);
  const taxedYearly = plan.considerTax && plan.distributionType === "distributing";
  // A loss earns no tax credit.
  const yearlyRate =
    (plan.yearlyInterest / 100) *
    (taxedYearly && plan.yearlyInterest > 0 ? 1 - taxShare : 1);

  // Bring saving and interest intervals to one period length.
  let rate: number;
  let periods: number;
  let payment: number;
  let inAdvance = true;
  if (plan.saveInterval === "yearly") {
    const compounding = { monthly: 12, quarterly: 4, yearly: 1 }[plan.interestInterval];
    rate = (1 + yearlyRate / compounding) ** compounding - 1;
    periods = plan.durationYears;
    payment = plan.savingRate;
  } else if (plan.interestInterval === "monthly") {
    rate = yearlyRate / 12;
    periods = plan.durationYears * 12;
    payment = plan.savingRate;
  } else {
    // Monthly deposits earn simple interest until the next interest date:
    // 3 + 2 + 1 months within a quarter, 12 + 11 + ... + 1 within a year.
    const perYear = plan.interestInterval === "quarterly" ? 4 : 1;
    const months = 12 / perYear;
    const averageMonths = plan.interestInterval === "quarterly" ? 2 : 6.5;
    rate = yearlyRate / perYear;
    periods = plan.durationYears * perYear;
    payment = plan.savingRate * (months + averageMonths * rate);
    inAdvance = false;
  }

  const growth = (1 + rate) ** periods;
  const annuity = rate === 0 ? periods : (growth - 1) / rate;
  const beforeTax = round2(
    plan.startValue * growth + payment * (inAdvance ? 1 + rate : 1) * annuity,
  );

  if (plan.considerTax && plan.distributionType === "accumulating") {
    const gains = beforeTax - depositsOf(plan);
    return beforeTax - Math.max(0, gains * taxShare);
  }
  return beforeTax;
}

/**
 * Finds the value in [lower, upper] for which the end value hits the target.
 * The end value grows with each of the searched parameters.
 */
function solve(
  target: number,
  endValueFor: (value: number) => number,
  lower: number,
  upper: number,
): number | null {
  if (endValueFor(lower) > target) return null;
  // "Not reached" also covers what is no number at all: without any capital
  // an ever higher interest rate ends in 0 × ∞.
  const reaches = (value: number) => endValueFor(value) >= target;
  for (let expansion = 0; !reaches(upper); expansion++) {
    if (expansion === 12) return null;
    lower = upper;
    upper *= 2;
  }
  for (let i = 0; i < 200 && upper - lower > 1e-10 * Math.max(1, upper); i++) {
    const middle = (lower + upper) / 2;
    if (reaches(middle)) upper = middle;
    else lower = middle;
  }
  return (lower + upper) / 2;
}

/**
 * Finds the negative starting capital for which the end value hits a target
 * that is already exceeded with a starting capital of 0.
 */
function solveBelowZero(
  target: number,
  endValueFor: (value: number) => number,
): number | null {
  let lower = -(endValueFor(0) - target) - 1;
  for (let expansion = 0; endValueFor(lower) > target; expansion++) {
    if (expansion === 12) return null;
    lower *= 2;
  }
  let upper = 0;
  for (let i = 0; i < 200 && upper - lower > 1e-10 * Math.max(1, -lower); i++) {
    const middle = (lower + upper) / 2;
    if (endValueFor(middle) >= target) upper = middle;
    else lower = middle;
  }
  // The upper end never ends below the target (the end value is rounded to cents).
  return upper;
}

const UNREACHABLE: Record<Exclude<SavingsOutput, "endValue">, CalculationError> = {
  startValue: "unreachableStartValue",
  savingRate: "unreachableSavingRate",
  yearlyInterest: "unreachableYearlyInterest",
  duration: "unreachableDuration",
};

/**
 * The end value that is reached even when the searched figure is zero; a
 * target below it needs nothing of that figure. Null when the end value
 * itself is searched.
 */
export function minimumEndValue(input: SavingsInput): number | null {
  const { output } = input;
  if (output === "endValue") return null;
  const key = output === "duration" ? "durationYears" : output;
  const plan = {
    ...input,
    yearlyInterest: input.yearlyInterest - (input.costs ?? 0) - (input.inflation ?? 0),
  };
  return endValueOf({ ...plan, [key]: 0 });
}

export function calculateSavings(input: SavingsInput): {
  result: SavingsResult | null;
  errors: CalculationError[];
} {
  const { output, endValue: target, costs = 0, inflation = 0, ...given } = input;
  // Costs and inflation reduce the interest rate; the searched rate is the one
  // after them, and the result names it before.
  const deductions = costs + inflation;
  const plan: Plan = { ...given, yearlyInterest: given.yearlyInterest - deductions };

  if (output !== "duration" && plan.durationYears <= 0) {
    return { result: null, errors: ["durationPositive"] };
  }

  let alreadyReached = false;
  if (output !== "endValue") {
    const key = output === "duration" ? "durationYears" : output;
    const endValueFor = (value: number) => endValueOf({ ...plan, [key]: value });
    if (endValueFor(0) > target) {
      alreadyReached = true;
      if (output === "startValue") {
        // As at Finanzfluss: a negative starting capital that brings the end
        // value down to the target.
        const negative = solveBelowZero(target, endValueFor);
        if (negative === null) return { result: null, errors: [UNREACHABLE[output]] };
        plan.startValue = negative;
      } else {
        // Nothing of the searched figure is needed: the answer is zero.
        plan[key] = 0;
      }
    } else {
      const range = {
        startValue: [0, Math.max(1, target)],
        savingRate: [0, Math.max(1, target)],
        yearlyInterest: [0, 100],
        durationYears: [0, 100],
      }[key];
      const solution = solve(target, endValueFor, range[0], range[1]);
      if (solution === null) {
        return { result: null, errors: [UNREACHABLE[output]] };
      }
      plan[key] = solution;
    }
  }

  const endValue =
    output === "endValue" || alreadyReached ? endValueOf(plan) : target;
  const deposits = depositsOf(plan);

  const years: SavingsResult["years"] = [];
  for (let year = 1; year < plan.durationYears; year++) {
    // After taxes, as if sold at the end of that year. Without this the last
    // column, the only one that bears the tax of an accumulating fund, would
    // drop below the one before it.
    const atYear: Plan = { ...plan, durationYears: year };
    years.push({
      year,
      deposits: depositsOf(atYear),
      interest: endValueOf(atYear) - depositsOf(atYear),
    });
  }
  years.push({
    year: Math.ceil(plan.durationYears),
    deposits,
    interest: endValue - deposits,
  });

  return {
    result: {
      startValue: plan.startValue,
      savingRate: plan.savingRate,
      yearlyInterest: plan.yearlyInterest + deductions,
      durationYears: plan.durationYears,
      endValue,
      deposits,
      interest: endValue - deposits,
      years,
      alreadyReached,
    },
    errors: [],
  };
}

/**
 * The same plan without taxes: what it reaches and the course before taxes.
 * Whatever was searched, the figures of the result lead to its end value.
 */
export function withoutTax(
  input: SavingsInput,
  result: SavingsResult,
): SavingsResult | null {
  return calculateSavings({
    ...input,
    output: "endValue",
    startValue: result.startValue,
    savingRate: result.savingRate,
    yearlyInterest: result.yearlyInterest,
    durationYears: result.durationYears,
    considerTax: false,
  }).result;
}
