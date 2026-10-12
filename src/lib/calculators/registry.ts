import type { AllSettings, SettingsScope } from "@/lib/settings/schema";
import { type PlanInput, type Pots, splitSavingsRate } from "@/lib/plan/plan";
import {
  AV_CONTRIBUTION_CAP,
  AV_DEPOT_START_YEAR,
  type AvDepotInput,
} from "./av-depot";
import type { PensionGapInput } from "./pension-gap";
import type { SavingsInput } from "./savings";
import type { WithdrawalPlanInput } from "./withdrawal-plan";

export interface CalculatorInfo {
  /** Also the settings scope of the calculator. */
  id: Exclude<SettingsScope, "shared" | "plan">;
  href: string;
}

/**
 * Every calculator of the cockpit; drives the navigation and the profile
 * pickers of the start page. The order is the one to fill them in: the pension
 * gap sets the goal, then the Altersvorsorgedepot and the savings calculator
 * (the ETF depot) build the capital, the withdrawal plan pays it out.
 * Titles and descriptions are in src/lib/i18n, under `calculators`.
 */
export const calculators: CalculatorInfo[] = [
  { id: "pension-gap", href: "/rechner/rentenluecke" },
  { id: "av-depot", href: "/rechner/altersvorsorgedepot" },
  { id: "savings", href: "/rechner/sparrechner" },
  { id: "withdrawal-plan", href: "/rechner/entnahmeplan" },
];

/** The most that can be paid into the AV-Depot per month. */
export const AV_DEPOT_MAX_MONTHLY = AV_CONTRIBUTION_CAP / 12;

export function toAvDepotInput(settings: AllSettings): AvDepotInput {
  const { shared } = settings;
  return {
    age: shared.age,
    retirementAge: shared.retirementAge,
    zveSavingsPhase: shared.zveSavingsPhase,
    zveRetirement: shared.zveRetirement,
    // What the savings rate exceeds the maximum by cannot go into the AV-Depot.
    savingsRate: Math.min(shared.savingsRateMonthly, AV_DEPOT_MAX_MONTHLY) * 12,
    etfReturnRate: shared.expectedReturn,
    exemptionOrder: shared.exemptionOrder,
    childBirthYears: shared.childBirthYears,
    payoutReturnRate: shared.retirementReturn,
    payoutUntilAge: shared.payoutUntilAge,
    ...settings["av-depot"],
  };
}

export function toPensionGapInput(settings: AllSettings): PensionGapInput {
  const { shared } = settings;
  return {
    ...settings["pension-gap"],
    age: shared.age,
    retirementAge: shared.retirementAge,
    payoutUntilAge: shared.payoutUntilAge,
    currentCapital: shared.currentCapital,
    returnUntilRetirement: shared.expectedReturn,
    retirementReturn: shared.retirementReturn,
    considerInflation: shared.considerInflation,
    inflationRate: shared.inflationRate,
    capitalGainsTax: shared.capitalGainsTax,
  };
}

export function toSavingsInput(settings: AllSettings): SavingsInput {
  const { shared, savings } = settings;
  return {
    output: savings.output,
    startValue: shared.currentCapital,
    // The shared rate is per month; a yearly plan pays twelve of them at once.
    savingRate:
      shared.savingsRateMonthly * (savings.saveInterval === "monthly" ? 1 : 12),
    saveInterval: savings.saveInterval,
    yearlyInterest: shared.expectedReturn,
    interestInterval: savings.interestInterval,
    durationYears: savings.untilRetirement
      ? shared.retirementAge - shared.age
      : savings.durationYears,
    endValue: savings.endValue,
    considerTax: savings.considerTax,
    capitalGainsTax: shared.capitalGainsTax,
    distributionType: savings.distributionType,
    partialExemption: savings.considerPartialExemption
      ? savings.partialExemption
      : 0,
  };
}

export function toWithdrawalPlanInput(
  settings: AllSettings,
): WithdrawalPlanInput {
  const plan = settings["withdrawal-plan"];
  // Inflation first, then the estimated tax deduction of the pension gap
  // profile: the same order as in the overall plan.
  const taxShare = plan.considerTax
    ? settings["pension-gap"].taxPrediction / 100
    : 0;
  const inflation = plan.realTerms ? settings.shared.inflationRate : 0;
  return {
    output: plan.output,
    capital: plan.capitalAssets,
    amount: plan.withdrawalAmount,
    periodYears: plan.periodYears,
    interestRate: (settings.shared.retirementReturn - inflation) * (1 - taxShare),
    interval: plan.interval,
    capitalConsumption: plan.capitalConsumption,
  };
}

/**
 * The Gesamtplan for the given settings. `values` are the current balances
 * of the pots, from the latest recorded snapshot; before the first snapshot
 * the plan starts with the existing capital of the shared values, held in the
 * ETF-Depot.
 */
export function toPlanInput(settings: AllSettings, values?: Pots): PlanInput {
  const { shared, plan } = settings;
  const shares = { av: plan.avDepotShare, cash: plan.cashShare };
  const rates = splitSavingsRate(shared.savingsRateMonthly, shares);

  return {
    age: shared.age,
    retirementAge: shared.retirementAge,
    payoutUntilAge: shared.payoutUntilAge,
    inflationRate: shared.inflationRate,
    expectedReturn: shared.expectedReturn,
    retirementReturn: shared.retirementReturn,
    cashReturn: plan.cashReturn,
    capitalGainsTax: shared.capitalGainsTax,
    depotVolatility: plan.depotVolatility,
    cashVolatility: plan.cashVolatility,
    pension: settings["pension-gap"],
    shares,
    rates,
    values: values ?? { av: 0, depot: shared.currentCapital, cash: 0 },
    avDepot: {
      ...toAvDepotInput(settings),
      savingsRate: rates.av * 12,
      // Fixed, so a frozen plan does not change with the calendar.
      currentYear: Math.max(AV_DEPOT_START_YEAR, new Date().getFullYear()),
    },
    capitalConsumption: settings["withdrawal-plan"].capitalConsumption,
    confidenceTarget: plan.confidenceTarget,
    lowerGuardrail: plan.lowerGuardrail,
    upperGuardrail: plan.upperGuardrail,
  };
}
