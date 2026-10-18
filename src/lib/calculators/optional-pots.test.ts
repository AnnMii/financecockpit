import { describe, expect, it } from "vitest";
import {
  calculatePlan,
  splitSavingsRate,
  validatePlanInput,
  withSavingsRate,
} from "@/lib/plan/plan";
import { defaultSettings } from "@/lib/settings/schema";
import { budgetUse } from "./budget";
import { toPlanInput } from "./registry";

function settingsWith(plan: { useAvDepot?: boolean; useDepot?: boolean }) {
  const s = defaultSettings();
  return {
    ...s,
    shared: { ...s.shared, investableMonthly: 500, currentCapital: 10_000 },
    "av-depot": { ...s["av-depot"], savingsRateMonthly: 150 },
    savings: { ...s.savings, savingsRateMonthly: 250 },
    plan: { ...s.plan, cashMonthly: 50, ...plan },
  };
}

describe("a plan without an AV-Depot", () => {
  const settings = settingsWith({ useAvDepot: false });

  it("pays nothing into it and has no AV-Depot input", () => {
    const input = toPlanInput(settings);
    expect(input.avDepot).toBeNull();
    expect(input.rates).toEqual({ av: 0, depot: 250, cash: 50 });
    expect(validatePlanInput(input)).toEqual([]);
  });

  it("leaves its rate out of the budget", () => {
    expect(budgetUse(settings)).toMatchObject({ av: 0, planned: 300, free: 200 });
  });

  it("has no pension and no capital from it", () => {
    const { typical } = calculatePlan({ ...toPlanInput(settings), paths: 200 });
    expect(typical.avCapital).toBe(0);
    expect(typical.avPension).toBe(0);
  });
});

describe("a plan without an ETF depot", () => {
  const settings = settingsWith({ useDepot: false });

  it("leaves its rate out and keeps existing capital in the savings account", () => {
    const input = toPlanInput(settings);
    expect(input.depotUsed).toBe(false);
    expect(input.rates).toEqual({ av: 150, depot: 0, cash: 50 });
    expect(input.values).toEqual({ av: 0, depot: 0, cash: 10_000 });
    expect(budgetUse(settings)).toMatchObject({ depot: 0, planned: 200 });
  });

  it("sends additional savings to the savings account instead", () => {
    const input = toPlanInput(settings);
    const more = withSavingsRate(input, 400);
    expect(more.rates.depot).toBe(0);
    expect(more.rates.av + more.rates.cash).toBeCloseTo(400);
  });

  it("splits like before when the depot is used", () => {
    expect(splitSavingsRate(1_000, { av: 0, cash: 20 }, true, false)).toEqual({
      av: 0,
      depot: 0,
      cash: 1_000,
    });
  });
});

describe("a plan with neither", () => {
  it("still calculates, saving into the savings account only", () => {
    const settings = settingsWith({ useAvDepot: false, useDepot: false });
    const input = toPlanInput(settings);
    expect(input.rates).toEqual({ av: 0, depot: 0, cash: 50 });
    expect(budgetUse(settings).planned).toBe(50);
    const result = calculatePlan({ ...input, paths: 200 });
    expect(result.wealthAtRetirement.p50).toBeGreaterThan(0);
  });

  it("puts an AV rate below the minimum into the savings account", () => {
    const s = settingsWith({ useDepot: false });
    s["av-depot"].savingsRateMonthly = 5;
    expect(toPlanInput(s).rates).toEqual({ av: 0, depot: 0, cash: 55 });
  });
});
