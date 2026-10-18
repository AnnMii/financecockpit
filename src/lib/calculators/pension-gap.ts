/**
 * Pension gap calculator: how big is the gap between the expected net pension
 * and the desired pension, which capital closes it, and which savings rate leads
 * there?
 *
 * The formulas are derived from the answers of the Finanzfluss calculator
 * (https://www.finanzfluss.de/rechner/rentenluecke-berechnen/); its source code
 * is not public. The answers are in test/fixtures/pension-gap.json.
 */

import type { CalculationError } from "./errors";
import {
  type DistributionType,
  type InterestInterval,
  calculateSavings,
} from "./savings";

export interface PensionGapInput {
  /** Expected pension entitlements, each gross per month. */
  statePension: number;
  companyPension: number;
  privatePension: number;
  riesterPension: number;
  /** Estimated tax deduction in percent. */
  taxPrediction: number;
  yearlyTaxFreeAmount: number;
  /** Desired net pension per month. */
  desiredPension: number;
  age: number;
  retirementAge: number;
  /** The capital has to last until this age. */
  payoutUntilAge: number;
  currentCapital: number;
  /** Expected return until retirement / in retirement, in percent. */
  returnUntilRetirement: number;
  retirementReturn: number;
  considerInflation: boolean;
  inflationRate: number;
  /** Capital gains tax in percent; reduces the return until retirement. */
  capitalGainsTax: number;
  /**
   * When set, the saving phase is calculated by the savings calculator with
   * these settings instead of with the capital gains tax above: its tax,
   * partial exemption, costs and interest interval, deposits at the start of
   * the month. The inflation still follows `considerInflation`.
   */
  savingPhase?: SavingPhaseLikeSavings;
}

/** The settings of a savings calculator profile that shape the saving phase. */
export interface SavingPhaseLikeSavings {
  considerTax: boolean;
  /** Capital gains tax in percent, applied when `considerTax` is set. */
  capitalGainsTax: number;
  distributionType: DistributionType;
  /** Partial exemption in percent; 0 when it is not taken into account. */
  partialExemption: number;
  /** Costs per year in percent. */
  costs: number;
  interestInterval: InterestInterval;
}

export interface GapClosing {
  /** Capital that has to be there at retirement. */
  capital: number;
  /** Monthly savings rate that leads there by retirement. */
  savingsRate: number;
}

export interface PensionGapYear {
  age: number;
  capital: number;
  phase: "saving" | "payout";
}

export interface PensionGapResult {
  grossPension: number;
  netPension: number;
  /** Shortfall per month; 0 when the net pension covers the desired pension. */
  gap: number;
  yearsUntilRetirement: number;
  payoutYears: number;
  /** The capital is used up by the end of the payout. */
  withConsumption: GapClosing;
  /** Only the interest is withdrawn; null when the interest is not enough for that. */
  withoutConsumption: GapClosing | null;
  /** Wealth at the end of each year of life in the model that uses the capital up. */
  years: PensionGapYear[];
}

export function validatePensionGapInput(
  input: PensionGapInput,
): CalculationError[] {
  const errors: CalculationError[] = [];
  if (input.age >= input.retirementAge) {
    errors.push("ageBeforeRetirement");
  }
  if (input.payoutUntilAge <= input.retirementAge) {
    errors.push("payoutAfterRetirement");
  }
  if (input.taxPrediction >= 100 || input.capitalGainsTax >= 100) {
    errors.push("taxBelow100");
  }
  return errors;
}

export function calculatePensionGap(input: PensionGapInput): PensionGapResult {
  const grossPension =
    input.statePension +
    input.companyPension +
    input.privatePension +
    input.riesterPension;
  const taxRate = input.taxPrediction / 100;
  const yearlyTax =
    Math.max(0, grossPension * 12 - input.yearlyTaxFreeAmount) * taxRate;
  const netPension = grossPension - yearlyTax / 12;
  const gap = Math.max(0, input.desiredPension - netPension);

  const { payoutRate, savingRate } = pensionGapRates(input);

  const yearsUntilRetirement = input.retirementAge - input.age;
  const payoutYears = input.payoutUntilAge - input.retirementAge;
  const savingMonths = yearsUntilRetirement * 12;
  const payoutMonths = payoutYears * 12;

  const closing = (capital: number): GapClosing => ({
    capital,
    savingsRate:
      savingsCalculation(input, capital)?.savingRate ??
      requiredSavingsRate(capital, input.currentCapital, savingRate, savingMonths),
  });

  const withConsumption = closing(
    presentValueDue(gap, payoutRate, payoutMonths),
  );
  const withoutConsumption =
    gap === 0 ? closing(0) : payoutRate > 0 ? closing(gap / payoutRate) : null;

  return {
    grossPension,
    netPension,
    gap,
    yearsUntilRetirement,
    payoutYears,
    withConsumption,
    withoutConsumption,
    years: capitalByYear(
      input,
      withConsumption.savingsRate,
      gap,
      savingRate,
      payoutRate,
    ),
  };
}

/**
 * The saving phase worked out by the savings calculator, for a profile that
 * asks for it; null otherwise. `capital` is the target when the savings rate
 * is searched, and `rate` the given rate when the course is wanted.
 */
function savingsCalculation(
  input: PensionGapInput,
  capital: number,
  rate?: number,
) {
  const like = input.savingPhase;
  if (!like || input.retirementAge <= input.age) return null;
  const { result } = calculateSavings({
    output: rate === undefined ? "savingRate" : "endValue",
    startValue: input.currentCapital,
    savingRate: rate ?? 0,
    saveInterval: "monthly",
    yearlyInterest: input.returnUntilRetirement,
    costs: like.costs,
    inflation: input.considerInflation ? input.inflationRate : 0,
    interestInterval: like.interestInterval,
    durationYears: input.retirementAge - input.age,
    endValue: capital,
    considerTax: like.considerTax,
    capitalGainsTax: like.capitalGainsTax,
    distributionType: like.distributionType,
    partialExemption: like.partialExemption,
  });
  return result;
}

/** Monthly interest rates after inflation and taxes: in retirement and until then. */
export function pensionGapRates(input: PensionGapInput): {
  payoutRate: number;
  savingRate: number;
} {
  const inflation = input.considerInflation ? input.inflationRate : 0;
  return {
    payoutRate:
      (((input.retirementReturn - inflation) / 100) *
        (1 - input.taxPrediction / 100)) /
      12,
    savingRate:
      (((input.returnUntilRetirement - inflation) / 100) *
        (1 - input.capitalGainsTax / 100)) /
      12,
  };
}

/** Present value of a monthly pension paid at the start of each month. */
export function presentValueDue(payment: number, rate: number, months: number): number {
  if (rate === 0) return payment * months;
  return ((payment * (1 - (1 + rate) ** -months)) / rate) * (1 + rate);
}

/** Monthly rate paid at the end of each month with which `current` grows to `target` in `months` months. */
function requiredSavingsRate(
  target: number,
  current: number,
  rate: number,
  months: number,
): number {
  const growth = (1 + rate) ** months;
  const missing = Math.max(0, target - current * growth);
  const futureValueFactor = rate === 0 ? months : (growth - 1) / rate;
  return missing / futureValueFactor;
}

function capitalByYear(
  input: PensionGapInput,
  savingsRate: number,
  gap: number,
  savingRate: number,
  payoutRate: number,
): PensionGapYear[] {
  const years: PensionGapYear[] = [];
  let capital = input.currentCapital;

  const like = savingsCalculation(input, 0, savingsRate);
  if (like) {
    // The saving phase as the savings calculator sees it (after tax, as if sold).
    for (const year of like.years) {
      capital = year.deposits + year.interest;
      years.push({ age: input.age + year.year, capital, phase: "saving" });
    }
  } else {
    for (let age = input.age + 1; age <= input.retirementAge; age++) {
      for (let month = 0; month < 12; month++) {
        capital = capital * (1 + savingRate) + savingsRate;
      }
      years.push({ age, capital, phase: "saving" });
    }
  }
  for (let age = input.retirementAge + 1; age <= input.payoutUntilAge; age++) {
    for (let month = 0; month < 12; month++) {
      capital = (capital - gap) * (1 + payoutRate);
    }
    // Rounding leaves a few cents around zero at the end.
    years.push({ age, capital: Math.max(0, capital), phase: "payout" });
  }
  return years;
}
