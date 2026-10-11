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
  // Rentenlücke
  | "taxBelow100"
  // Sparrechner
  | "durationPositive"
  | "unreachableStartValue"
  | "unreachableSavingRate"
  | "unreachableYearlyInterest"
  | "unreachableDuration"
  // Entnahmeplan
  | "interestAboveMinus100"
  | "capitalPositive"
  | "amountPositive"
  | "needsInterest"
  // Gesamtplan
  | "planSharesOver100"
  | "planGuardrailOrder";
