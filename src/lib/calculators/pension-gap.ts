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
    savingsRate: requiredSavingsRate(
      capital,
      input.currentCapital,
      savingRate,
      savingMonths,
    ),
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

  for (let age = input.age + 1; age <= input.retirementAge; age++) {
    for (let month = 0; month < 12; month++) {
      capital = capital * (1 + savingRate) + savingsRate;
    }
    years.push({ age, capital, phase: "saving" });
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
