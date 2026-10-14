/**
 * Reasons why a calculator cannot work with its inputs. The calculators
 * return these codes; the texts in both languages are in src/lib/i18n.
 */
export type CalculationError =
  // several calculators
  | "ageBeforeRetirement"
  | "payoutAfterRetirement"
  // Altersvorsorgedepot
  | "avAgeRange"
  | "avRetirementRange"
  | "avPayoutMin85"
  | "avSavingsRateRange"
  | "avReturnsPositive"
  | "avCostsBelowReturns"
  // Pension gap
  | "taxBelow100"
  // Savings calculator
  | "durationPositive"
  | "unreachableStartValue"
  | "unreachableSavingRate"
  | "unreachableYearlyInterest"
  | "unreachableDuration"
  // Withdrawal plan
  | "interestAboveMinus100"
  | "capitalPositive"
  | "amountPositive"
  | "needsInterest"
  // Overall plan
  | "planSharesOver100"
  | "planGuardrailOrder";
