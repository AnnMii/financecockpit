/**
 * Sparrechner: Aus Anfangskapital, Sparrate, Zinssatz, Laufzeit und Endkapital
 * wird jeweils die fünfte Größe berechnet, auf Wunsch mit Kapitalertragsteuer.
 *
 * Eigene Umsetzung, die dem Finanzfluss-Rechner folgt
 * (https://www.finanzfluss.de/rechner/sparrechner/). Das Original liegt als
 * Submodul unter vendor/finanzfluss-calculators;
 * test/upstream/savings.parity.test.ts vergleicht beide.
 *
 * Anders als das Original, das je Größe eine eigene Formel hat, wird hier nur
 * das Endkapital als Formel gerechnet; die anderen vier Größen ergeben sich
 * durch Suche nach dem Wert, der zum gewünschten Endkapital führt.
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
  /** Die gesuchte Größe; ihr Eingabewert wird ignoriert. */
  output: SavingsOutput;
  startValue: number;
  /** Einzahlung je Sparintervall, zu Beginn des Intervalls. */
  savingRate: number;
  saveInterval: SaveInterval;
  /** Zinssatz pro Jahr in Prozent. */
  yearlyInterest: number;
  interestInterval: InterestInterval;
  durationYears: number;
  endValue: number;
  considerTax: boolean;
  /** Kapitalertragsteuer in Prozent. */
  capitalGainsTax: number;
  /** Ausschüttend: Zinsen werden laufend versteuert. Thesaurierend: am Ende. */
  distributionType: DistributionType;
  /** Teilfreistellung in Prozent; 0, wenn sie nicht berücksichtigt wird. */
  partialExemption: number;
}

export interface SavingsResult {
  startValue: number;
  savingRate: number;
  yearlyInterest: number;
  durationYears: number;
  endValue: number;
  /** Anfangskapital plus alle Einzahlungen. */
  deposits: number;
  /** Zinsen nach Steuern. */
  interest: number;
  /** Stand am Ende jedes Jahres; das letzte Jahr kann angebrochen sein. */
  years: { year: number; deposits: number; interest: number }[];
  /**
   * Das gewünschte Endkapital wird schon erreicht, wenn die gesuchte Größe 0
   * ist. Das Ergebnis ist dann dieser Plan, und `endValue`, was er erreicht.
   */
  alreadyReached: boolean;
}

type Plan = Omit<SavingsInput, "output" | "endValue">;

const round2 = (value: number) => Math.round(value * 100) / 100;

function depositsOf(plan: Plan): number {
  const perYear = plan.saveInterval === "monthly" ? 12 : 1;
  return plan.startValue + plan.savingRate * plan.durationYears * perYear;
}

/** Endkapital nach Steuern. */
function endValueOf(plan: Plan): number {
  const taxShare =
    (plan.capitalGainsTax / 100) * (1 - plan.partialExemption / 100);
  const taxedYearly = plan.considerTax && plan.distributionType === "distributing";
  const yearlyRate = (plan.yearlyInterest / 100) * (taxedYearly ? 1 - taxShare : 1);

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
  return endValueOf({ ...input, [key]: 0 });
}

export function calculateSavings(input: SavingsInput): {
  result: SavingsResult | null;
  errors: CalculationError[];
} {
  const { output, endValue: target, ...given } = input;
  const plan: Plan = { ...given };

  if (output !== "duration" && plan.durationYears <= 0) {
    return { result: null, errors: ["durationPositive"] };
  }

  let alreadyReached = false;
  if (output !== "endValue") {
    const key = output === "duration" ? "durationYears" : output;
    const endValueFor = (value: number) => endValueOf({ ...plan, [key]: value });
    if (endValueFor(0) > target) {
      // Nothing of the searched figure is needed: the answer is zero.
      alreadyReached = true;
      plan[key] = 0;
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
      yearlyInterest: plan.yearlyInterest,
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
