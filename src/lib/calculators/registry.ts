import type { AllSettings, SettingsScope } from "@/lib/settings/schema";
import type { PlanInput, Pots } from "@/lib/plan/plan";
import {
  AV_CONTRIBUTION_CAP,
  AV_DEPOT_START_YEAR,
  type AvDepotInput,
  MIN_OWN_CONTRIBUTION,
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
  { id: "pension-gap", href: "/calculators/pension-gap" },
  { id: "av-depot", href: "/calculators/av-depot" },
  { id: "savings", href: "/calculators/savings" },
  { id: "withdrawal-plan", href: "/calculators/withdrawal-plan" },
];

/** The most that can be paid into the AV-Depot per month. */
export const AV_DEPOT_MAX_MONTHLY = AV_CONTRIBUTION_CAP / 12;

export function toAvDepotInput(settings: AllSettings): AvDepotInput {
  const { shared } = settings;
  const { savingsRateMonthly, ...own } = settings["av-depot"];
  return {
    age: shared.age,
    retirementAge: shared.retirementAge,
    taxableIncomeSavingsPhase: shared.taxableIncomeSavingsPhase,
    taxableIncomeRetirement: shared.taxableIncomeRetirement,
    savingsRate: savingsRateMonthly * 12,
    etfReturnRate: shared.expectedReturn,
    exemptionOrder: shared.exemptionOrder,
    childBirthYears: shared.childBirthYears,
    payoutReturnRate: shared.retirementReturn,
    payoutUntilAge: shared.payoutUntilAge,
    ...own,
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
    // The rate is per month; a yearly plan pays twelve of them at once.
    savingRate:
      savings.savingsRateMonthly * (savings.saveInterval === "monthly" ? 1 : 12),
    saveInterval: savings.saveInterval,
    yearlyInterest: shared.expectedReturn,
    costs: savings.costs,
    inflation: savings.realTerms ? shared.inflationRate : 0,
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
 * ETF-Depot. The savings rates are those of the calculators: the AV-Depot, the
 * savings calculator (the ETF depot) and the savings account of the plan.
 */
export function toPlanInput(settings: AllSettings, values?: Pots): PlanInput {
  const { shared, plan } = settings;
  const useAv = plan.useAvDepot;
  const useDepot = plan.useDepot;
  let av = useAv ? settings["av-depot"].savingsRateMonthly : 0;
  let depot = useDepot ? settings.savings.savingsRateMonthly : 0;
  let cash = plan.cashMonthly;
  // Below its minimum contribution there is no AV-Depot; the money goes to the
  // depot, or to the savings account when there is no depot either.
  if (av * 12 < MIN_OWN_CONTRIBUTION) {
    if (useDepot) depot += av;
    else cash += av;
    av = 0;
  }
  const rates = { av, depot, cash };

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
    rates,
    budget: shared.investableMonthly,
    depotCosts: settings.savings.costs,
    depotUsed: useDepot,
    values:
      values ??
      (useDepot
        ? { av: 0, depot: shared.currentCapital, cash: 0 }
        : { av: 0, depot: 0, cash: shared.currentCapital }),
    avDepot: useAv
      ? {
          ...toAvDepotInput(settings),
          savingsRate: rates.av * 12,
          // Fixed, so a frozen plan does not change with the calendar.
          currentYear: Math.max(AV_DEPOT_START_YEAR, new Date().getFullYear()),
        }
      : null,
    capitalConsumption: settings["withdrawal-plan"].capitalConsumption,
    confidenceTarget: plan.confidenceTarget,
    lowerGuardrail: plan.lowerGuardrail,
    upperGuardrail: plan.upperGuardrail,
  };
}
