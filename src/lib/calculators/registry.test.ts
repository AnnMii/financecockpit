import { describe, expect, it } from "vitest";
import { calculatePlan } from "@/lib/plan/plan";
import { type AllSettings, defaultSettings } from "@/lib/settings/schema";
import { toPlanInput, toWithdrawalPlanInput } from "./registry";
import { calculateWithdrawalPlan } from "./withdrawal-plan";

const withWithdrawal = (
  settings: AllSettings,
  changes: Partial<AllSettings["withdrawal-plan"]>,
): AllSettings => ({
  ...settings,
  "withdrawal-plan": { ...settings["withdrawal-plan"], ...changes },
});

describe("toWithdrawalPlanInput", () => {
  const settings = defaultSettings();

  it("uses the return in retirement as it is by default", () => {
    expect(toWithdrawalPlanInput(settings).interestRate).toBe(3);
  });

  it("takes the estimated tax deduction of the pension gap profile off the return", () => {
    const taxed = {
      ...withWithdrawal(settings, { considerTax: true }),
      "pension-gap": { ...settings["pension-gap"], taxPrediction: 20 },
    };
    expect(toWithdrawalPlanInput(taxed).interestRate).toBeCloseTo(2.4, 10);
    // A lower return pays less per month from the same capital.
    const plain = calculateWithdrawalPlan({ ...toWithdrawalPlanInput(settings), output: "amount" });
    const withTax = calculateWithdrawalPlan({ ...toWithdrawalPlanInput(taxed), output: "amount" });
    expect(withTax.amount).toBeLessThan(plain.amount);
  });

  it("deducts the inflation before the tax, as the overall plan does", () => {
    const real = withWithdrawal(settings, { realTerms: true });
    expect(toWithdrawalPlanInput(real).interestRate).toBeCloseTo(1, 10);
    const both = {
      ...withWithdrawal(settings, { realTerms: true, considerTax: true }),
      "pension-gap": { ...settings["pension-gap"], taxPrediction: 20 },
    };
    // (3 % − 2 %) × (1 − 20 %), not 3 % × 0,8 − 2 %
    expect(toWithdrawalPlanInput(both).interestRate).toBeCloseTo(0.8, 10);
  });
});

describe("the withdrawal plan next to the overall plan", () => {
  // The overall plan's payout of the free capital per euro of that capital and
  // month, against the calculator with taxes and today's purchasing power.
  it.each([2, 3, 4, 6])(
    "pays the same per month for the same capital, with a return of %s %",
    (retirementReturn) => {
      const base = defaultSettings();
      const settings = withWithdrawal(
        {
          ...base,
          shared: { ...base.shared, currentCapital: 50_000, retirementReturn },
          plan: { ...base.plan, avDepotShare: 0 },
        },
        { realTerms: true, considerTax: true },
      );
      const { typical } = calculatePlan({ ...toPlanInput(settings), paths: 200 });
      expect(typical.freeCapital).toBeGreaterThan(0);
      const planned = typical.freePension / typical.freeCapital;

      const capital = 100_000;
      const calculated =
        calculateWithdrawalPlan({
          ...toWithdrawalPlanInput(settings),
          output: "amount",
          capital,
          periodYears: settings.shared.payoutUntilAge - settings.shared.retirementAge,
          capitalConsumption: true,
        }).amount / capital;

      // Withdrawals at the start against the end of the interval, and the rate
      // converted differently: small differences remain.
      expect(Math.abs(calculated - planned) / planned).toBeLessThan(0.03);
    },
  );
});
