import type { AllSettings, SettingsScope } from "@/lib/settings/schema";
import type { PlanInput, Pots } from "@/lib/plan/plan";
import {
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
 * Every calculator of the cockpit; drives the navigation and the start page.
 * Titles and descriptions are in src/lib/i18n, under `calculators`.
 */
export const calculators: CalculatorInfo[] = [
  { id: "av-depot", href: "/rechner/altersvorsorgedepot" },
  { id: "pension-gap", href: "/rechner/rentenluecke" },
  { id: "savings", href: "/rechner/sparrechner" },
  { id: "withdrawal-plan", href: "/rechner/entnahmeplan" },
];

export function toAvDepotInput(settings: AllSettings): AvDepotInput {
  const { shared } = settings;
  return {
    age: shared.age,
    retirementAge: shared.retirementAge,
    zveSavingsPhase: shared.zveSavingsPhase,
    zveRetirement: shared.zveRetirement,
    savingsRate: shared.savingsRateMonthly * 12,
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
  return {
    output: plan.output,
    capital: plan.capitalAssets,
    amount: plan.withdrawalAmount,
    periodYears: plan.periodYears,
    interestRate: settings.shared.retirementReturn,
    interval: plan.interval,
    capitalConsumption: plan.capitalConsumption,
  };
}

/**
 * The Gesamtplan for the given settings. `values` are the current balances
 * of the pots (from the latest recorded snapshot).
 */
export function toPlanInput(settings: AllSettings, values: Pots): PlanInput {
  const { shared, plan } = settings;
  const total = shared.savingsRateMonthly;
  let av = (total * plan.avDepotShare) / 100;
  const cash = (total * plan.cashShare) / 100;
  let depot = total - av - cash;

  // Below its minimum contribution there is no AV-Depot; the money goes to the depot.
  const hasAvDepot = av * 12 >= MIN_OWN_CONTRIBUTION;
  if (!hasAvDepot && depot >= 0) {
    depot += av;
    av = 0;
  }

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
    rates: { av, depot, cash },
    values,
    avDepot: hasAvDepot
      ? {
          ...toAvDepotInput(settings),
          savingsRate: av * 12,
          // Fixed, so a frozen plan does not change with the calendar.
          currentYear: Math.max(AV_DEPOT_START_YEAR, new Date().getFullYear()),
        }
      : null,
    confidenceTarget: plan.confidenceTarget,
    lowerGuardrail: plan.lowerGuardrail,
    upperGuardrail: plan.upperGuardrail,
  };
}
