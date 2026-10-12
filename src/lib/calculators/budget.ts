import type { AllSettings } from "@/lib/settings/schema";

/**
 * The monthly budget for investing (a shared value) against what the
 * calculators plan to pay in: the Altersvorsorgedepot and the savings
 * calculator (the ETF depot) with their own rates, and the savings account of
 * the overall plan.
 */
export type BudgetPart = "av" | "depot" | "cash";

export interface BudgetUse {
  available: number;
  av: number;
  depot: number;
  cash: number;
  /** The three rates together. */
  planned: number;
  /** What is left of the budget; negative when more is planned than there is. */
  free: number;
}

const cents = (value: number) => Math.round(value * 100) / 100;

export function budgetUse(settings: AllSettings): BudgetUse {
  const available = settings.shared.investableMonthly;
  const av = settings["av-depot"].savingsRateMonthly;
  const depot = settings.savings.savingsRateMonthly;
  const cash = settings.plan.cashMonthly;
  const planned = cents(av + depot + cash);
  return { available, av, depot, cash, planned, free: cents(available - planned) };
}

/** The value for one part that uses the budget up exactly, never below 0. */
export function restFor(use: BudgetUse, part: BudgetPart): number {
  return Math.max(0, cents(use.available - (use.planned - use[part])));
}
