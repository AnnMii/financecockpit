/**
 * Rentenlückenrechner: Wie groß ist die Lücke zwischen erwarteter Nettorente
 * und Wunschrente, welches Kapital schließt sie, und welche Sparrate führt
 * dorthin?
 *
 * Die Formeln sind aus den Antworten des Finanzfluss-Rechners hergeleitet
 * (https://www.finanzfluss.de/rechner/rentenluecke-berechnen/); dessen Quellcode
 * ist nicht öffentlich. Die Antworten liegen in test/fixtures/pension-gap.json.
 */

import type { CalculationError } from "./errors";

export interface PensionGapInput {
  /** Erwartete Rentenansprüche, jeweils brutto pro Monat. */
  statePension: number;
  companyPension: number;
  privatePension: number;
  riesterPension: number;
  /** Geschätzter Steuerabzug in Prozent. */
  taxPrediction: number;
  yearlyTaxFreeAmount: number;
  /** Gewünschte Nettorente pro Monat. */
  desiredPension: number;
  age: number;
  retirementAge: number;
  /** Bis zu diesem Alter soll das Kapital reichen. */
  payoutUntilAge: number;
  currentCapital: number;
  /** Erwartete Rendite bis zur Rente / im Ruhestand, in Prozent. */
  returnUntilRetirement: number;
  retirementReturn: number;
  considerInflation: boolean;
  inflationRate: number;
  /** Kapitalertragsteuer in Prozent, mindert die Rendite bis zur Rente. */
  capitalGainsTax: number;
}

export interface GapClosing {
  /** Kapital, das bei Renteneintritt vorhanden sein muss. */
  capital: number;
  /** Monatliche Sparrate, die bis zum Renteneintritt dorthin führt. */
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
  /** Fehlbetrag pro Monat; 0, wenn die Nettorente die Wunschrente deckt. */
  gap: number;
  yearsUntilRetirement: number;
  payoutYears: number;
  /** Das Kapital wird bis zum Ende der Auszahlung aufgebraucht. */
  withConsumption: GapClosing;
  /** Nur die Zinsen werden entnommen; null, wenn die Zinsen dafür nicht reichen. */
  withoutConsumption: GapClosing | null;
  /** Vermögen am Ende jedes Lebensjahres im Modell mit Kapitalverzehr. */
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

/** Monatliche Zinssätze nach Inflation und Steuern: im Ruhestand und bis dahin. */
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

/** Barwert einer vorschüssigen Monatsrente. */
export function presentValueDue(payment: number, rate: number, months: number): number {
  if (rate === 0) return payment * months;
  return ((payment * (1 - (1 + rate) ** -months)) / rate) * (1 + rate);
}

/** Nachschüssige Monatsrate, mit der `current` in `months` Monaten auf `target` wächst. */
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
