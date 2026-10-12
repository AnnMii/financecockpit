import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/schema";
import { budgetUse, restFor } from "./budget";
import { toAvDepotInput, toPlanInput, toSavingsInput } from "./registry";

function settingsWith(rates: { budget?: number; av?: number; depot?: number; cash?: number }) {
  const s = defaultSettings();
  return {
    ...s,
    shared: { ...s.shared, investableMonthly: rates.budget ?? 500 },
    "av-depot": { ...s["av-depot"], savingsRateMonthly: rates.av ?? 150 },
    savings: { ...s.savings, savingsRateMonthly: rates.depot ?? 250 },
    plan: { ...s.plan, cashMonthly: rates.cash ?? 50 },
  };
}

describe("budgetUse", () => {
  it("adds the rates of the calculators and compares them with the budget", () => {
    const use = budgetUse(settingsWith({ budget: 500, av: 150, depot: 250, cash: 50 }));
    expect(use).toMatchObject({ available: 500, planned: 450, free: 50 });
  });

  it("shows a negative remainder when more is planned than there is", () => {
    expect(budgetUse(settingsWith({ budget: 300 })).free).toBe(-150);
  });

  it("does not drift with fractions of cents", () => {
    const use = budgetUse(settingsWith({ budget: 100, av: 33.33, depot: 33.33, cash: 33.34 }));
    expect(use.planned).toBe(100);
    expect(use.free).toBe(0);
  });

  it("has defaults that use the budget exactly", () => {
    expect(budgetUse(defaultSettings()).free).toBe(0);
  });
});

describe("restFor", () => {
  it("is what the other parts leave", () => {
    const use = budgetUse(settingsWith({ budget: 500, av: 150, depot: 250, cash: 50 }));
    expect(restFor(use, "depot")).toBe(300);
    expect(restFor(use, "av")).toBe(200);
    expect(restFor(use, "cash")).toBe(100);
  });

  it("never goes below zero", () => {
    const use = budgetUse(settingsWith({ budget: 100, av: 150, depot: 250, cash: 50 }));
    expect(restFor(use, "depot")).toBe(0);
  });
});

describe("the rates in the calculators", () => {
  const settings = settingsWith({ av: 150, depot: 250, cash: 50 });

  it("go to the Altersvorsorgedepot and the savings calculator from their own profiles", () => {
    expect(toAvDepotInput(settings).savingsRate).toBe(150 * 12);
    expect(toSavingsInput(settings).savingRate).toBe(250);
    expect(toSavingsInput({ ...settings, savings: { ...settings.savings, saveInterval: "yearly" } }).savingRate).toBe(3_000);
  });

  it("make up the plan with the savings account of the plan", () => {
    const plan = toPlanInput(settings);
    expect(plan.rates).toEqual({ av: 150, depot: 250, cash: 50 });
    expect(plan.budget).toBe(500);
    expect(plan.avDepot!.savingsRate).toBe(1_800);
  });

  it("let the plan work without the Altersvorsorgedepot below its minimum", () => {
    const plan = toPlanInput(settingsWith({ av: 5, depot: 250, cash: 50 }));
    expect(plan.rates).toEqual({ av: 0, depot: 255, cash: 50 });
  });
});
