/**
 * Withdrawal plan: from the portfolio, the withdrawal amount and the withdrawal
 * period the third figure is calculated, with or without using up the capital.
 *
 * The formulas are derived from the answers of the Finanzfluss calculator
 * (https://www.finanzfluss.de/rechner/entnahmeplan/); its source code is
 * not public. The answers are in test/fixtures/withdrawal-plan.json.
 */

import type { CalculationError } from "./errors";

export type WithdrawalOutput = "amount" | "period" | "capital";
export type WithdrawalInterval = "monthly" | "quarterly" | "biannual" | "yearly";

export const WITHDRAWALS_PER_YEAR: Record<WithdrawalInterval, number> = {
  monthly: 12,
  quarterly: 4,
  biannual: 2,
  yearly: 1,
};

export interface WithdrawalPlanInput {
  /** The searched figure; its input value is ignored. */
  output: WithdrawalOutput;
  capital: number;
  /** Withdrawal per interval. */
  amount: number;
  periodYears: number;
  /** Interest rate per year in percent. */
  interestRate: number;
  interval: WithdrawalInterval;
  /** Without using up the capital only the interest is withdrawn. Meaningless for "period". */
  capitalConsumption: boolean;
}

export interface WithdrawalPlanResult {
  capital: number;
  amount: number;
  /** null when the withdrawal does not exceed the interest and the capital never ends. */
  periodYears: number | null;
  withdrawalsPerYear: number;
  /** Sum of all withdrawals; null for an endless withdrawal. */
  totalWithdrawn: number | null;
  /** Capital at the end of each year. */
  years: { year: number; capital: number }[];
}

/** Longest chart for plans that never run out. */
const ENDLESS_CHART_YEARS = 30;

export function validateWithdrawalPlanInput(
  input: WithdrawalPlanInput,
): CalculationError[] {
  const errors: CalculationError[] = [];
  if (input.interestRate <= -100) {
    errors.push("interestAboveMinus100");
  }
  if (input.output !== "capital" && input.capital <= 0) {
    errors.push("capitalPositive");
  }
  if (input.output !== "amount" && input.amount <= 0) {
    errors.push("amountPositive");
  }
  if (
    input.output !== "period" &&
    !input.capitalConsumption &&
    input.interestRate <= 0
  ) {
    errors.push("needsInterest");
  }
  return errors;
}

export function calculateWithdrawalPlan(
  input: WithdrawalPlanInput,
): WithdrawalPlanResult {
  const withdrawalsPerYear = WITHDRAWALS_PER_YEAR[input.interval];
  const yearlyGrowth = 1 + input.interestRate / 100;
  // Rate per interval that compounds to the yearly rate.
  const rate = yearlyGrowth ** (1 / withdrawalsPerYear) - 1;

  let { capital, amount } = input;
  let periodYears: number | null = input.periodYears;

  if (input.output === "period") {
    periodYears = yearsUntilEmpty(capital, amount, rate, withdrawalsPerYear);
  } else {
    const periods = input.periodYears * withdrawalsPerYear;
    // Share of the capital one withdrawal takes (annuity factor).
    const factor = !input.capitalConsumption
      ? rate
      : rate === 0
        ? 1 / periods
        : rate / (1 - yearlyGrowth ** -input.periodYears);
    if (input.output === "amount") amount = capital * factor;
    else capital = amount / factor;
  }

  const consumes = input.output === "period" || input.capitalConsumption;
  const chartYears = Math.ceil(periodYears ?? ENDLESS_CHART_YEARS);
  const years: WithdrawalPlanResult["years"] = [];
  let balance = capital;
  for (let year = 1; year <= chartYears; year++) {
    for (let i = 0; i < withdrawalsPerYear && balance > 0; i++) {
      balance = balance * (1 + rate) - amount;
    }
    // Without consumption the balance only moves by rounding.
    balance = consumes ? Math.max(0, balance) : capital;
    years.push({ year, capital: balance < 0.005 ? 0 : balance });
  }

  return {
    capital,
    amount,
    periodYears,
    withdrawalsPerYear,
    totalWithdrawn:
      periodYears === null ? null : amount * periodYears * withdrawalsPerYear,
    years,
  };
}

function yearsUntilEmpty(
  capital: number,
  amount: number,
  rate: number,
  withdrawalsPerYear: number,
): number | null {
  if (rate === 0) return capital / amount / withdrawalsPerYear;
  const interest = capital * rate;
  if (amount <= interest) return null;
  const periods = -Math.log(1 - interest / amount) / Math.log(1 + rate);
  return periods / withdrawalsPerYear;
}
