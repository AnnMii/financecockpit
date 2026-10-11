import { describe, expect, it } from "vitest";
import fixture from "../../../test/fixtures/withdrawal-plan.json";
import { parseGerman, tolerance } from "./fixtures";
import {
  type WithdrawalPlanInput,
  calculateWithdrawalPlan,
  validateWithdrawalPlanInput,
} from "./withdrawal-plan";

type Case = (typeof fixture.cases)[number];

const OUTPUTS = {
  withdrawlAmountCalc: "amount",
  withdrawlPeriodCalc: "period",
  capitalAssetsCalc: "capital",
} as const;
const INTERVALS = ["monthly", "quarterly", "biannual", "yearly"] as const;

function toInput(params: Case["params"]): WithdrawalPlanInput {
  return {
    output: OUTPUTS[params.output as keyof typeof OUTPUTS],
    capital: params.inputCapitalAssets,
    amount: params.inputWithdrawlAmount,
    periodYears: params.inputWithdrawlPeriod,
    interestRate: params.inputInterestRate,
    interval: INTERVALS[params.inputWithdrawlIntervall],
    capitalConsumption: params.inputCapitalConsumption === 1,
  };
}

const standard = toInput(fixture.cases[0].params);

describe("calculateWithdrawalPlan", () => {
  // Answers of the Finanzfluss calculator, see scripts/upstream-check-api.mjs
  it.each(fixture.cases)(
    "matches the Finanzfluss calculator: $name",
    ({ params, expected }) => {
      const result = calculateWithdrawalPlan(toInput(params));
      const close = (actual: number, recorded: string) =>
        expect(Math.abs(actual - parseGerman(recorded))).toBeLessThanOrEqual(
          tolerance(recorded),
        );
      const answer: Partial<Record<string, string | boolean>> = expected;

      if (typeof answer.outputResultWithdrawlAmount === "string") {
        close(result.amount, answer.outputResultWithdrawlAmount);
      }
      if (typeof answer.outputResultCapitalAssets === "string") {
        close(result.capital, answer.outputResultCapitalAssets);
      }
      if (answer.outputResultWithdrawlPeriodEndless === true) {
        expect(result.periodYears).toBeNull();
      } else if (typeof answer.outputResultWithdrawlPeriod === "string") {
        close(result.periodYears!, answer.outputResultWithdrawlPeriod);
      }
    },
  );

  it("uses the capital up exactly at the end of the period", () => {
    const result = calculateWithdrawalPlan(standard);
    expect(result.years).toHaveLength(10);
    expect(result.years[8].capital).toBeGreaterThan(0);
    expect(result.years[9].capital).toBe(0);
    expect(result.totalWithdrawn).toBeCloseTo(result.amount * 120, 6);
  });

  it("keeps the capital when only interest is withdrawn", () => {
    const result = calculateWithdrawalPlan({
      ...standard,
      capitalConsumption: false,
    });
    expect(result.years.every((y) => y.capital === 100_000)).toBe(true);
  });

  it("is consistent between the three calculations", () => {
    const amount = calculateWithdrawalPlan(standard).amount;
    const capital = calculateWithdrawalPlan({ ...standard, output: "capital", amount });
    const period = calculateWithdrawalPlan({ ...standard, output: "period", amount });
    expect(capital.capital).toBeCloseTo(100_000, 6);
    expect(period.periodYears).toBeCloseTo(10, 6);
  });

  it("handles an interest rate of zero", () => {
    const zero = { ...standard, interestRate: 0 };
    expect(calculateWithdrawalPlan(zero).amount).toBeCloseTo(100_000 / 120, 6);
    expect(
      calculateWithdrawalPlan({ ...zero, output: "period" }).periodYears,
    ).toBeCloseTo(100_000 / 1_200 / 12, 6);
    expect(
      calculateWithdrawalPlan({ ...zero, output: "capital" }).capital,
    ).toBeCloseTo(144_000, 6);
  });
});

describe("validateWithdrawalPlanInput", () => {
  it("accepts the standard inputs", () => {
    expect(validateWithdrawalPlanInput(standard)).toEqual([]);
  });

  it("rejects living off interest without interest", () => {
    expect(
      validateWithdrawalPlanInput({
        ...standard,
        interestRate: 0,
        capitalConsumption: false,
      }),
    ).not.toEqual([]);
  });
});
