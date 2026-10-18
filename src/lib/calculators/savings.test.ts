import { describe, expect, it } from "vitest";
import {
  type SavingsInput,
  calculateSavings,
  minimumEndValue,
} from "./savings";

const plan: SavingsInput = {
  output: "endValue",
  startValue: 5_000,
  savingRate: 150,
  saveInterval: "monthly",
  yearlyInterest: 6,
  interestInterval: "monthly",
  durationYears: 32,
  endValue: 250_000,
  considerTax: false,
  capitalGainsTax: 26.375,
  distributionType: "accumulating",
  partialExemption: 0,
};
const searched = ["startValue", "savingRate", "yearlyInterest", "duration"] as const;

describe("calculateSavings", () => {
  it.each(searched)("finds the figure that leads to the end value: %s", (output) => {
    const { result, errors } = calculateSavings({ ...plan, output });
    expect(errors).toEqual([]);
    // Putting the found figure back in gives the target again.
    const back = calculateSavings({
      ...plan,
      output: "endValue",
      startValue: result!.startValue,
      savingRate: result!.savingRate,
      yearlyInterest: result!.yearlyInterest,
      durationYears: result!.durationYears,
    });
    expect(back.result!.endValue).toBeCloseTo(250_000, 0);
  });
});

describe("what cannot be reached", () => {
  it("is named instead of calculated", () => {
    const idle = { ...plan, savingRate: 0, yearlyInterest: 0, startValue: 100 };
    expect(calculateSavings({ ...idle, output: "duration" })).toEqual({
      result: null,
      errors: ["unreachableDuration"],
    });
    expect(
      calculateSavings({ ...plan, output: "yearlyInterest", savingRate: 0, startValue: 0 }),
    ).toEqual({ result: null, errors: ["unreachableYearlyInterest"] });
    expect(calculateSavings({ ...plan, durationYears: 0 }).errors).toEqual([
      "durationPositive",
    ]);
  });
});

describe("minimumEndValue", () => {
  it("is null when the end value itself is searched", () => {
    expect(minimumEndValue(plan)).toBeNull();
  });

  it.each(searched)("is where a searched figure of zero ends: %s", (output) => {
    const minimum = minimumEndValue({ ...plan, output })!;
    expect(minimum).toBeGreaterThan(0);
    const key = output === "duration" ? "durationYears" : output;

    // Below it nothing of the searched figure is needed: the answer is zero,
    // except for the starting capital, which goes negative like at Finanzfluss.
    const below = calculateSavings({ ...plan, output, endValue: minimum * 0.9 });
    expect(below.errors).toEqual([]);
    expect(below.result!.alreadyReached).toBe(true);
    if (output === "startValue") {
      expect(below.result!.startValue).toBeLessThan(0);
      expect(below.result!.endValue).toBeCloseTo(minimum * 0.9, 1);
    } else {
      expect(below.result![key]).toBe(0);
      expect(below.result!.endValue).toBeCloseTo(minimum, 6);
    }

    const above = calculateSavings({ ...plan, output, endValue: minimum * 1.2 });
    expect(above.errors).toEqual([]);
    expect(above.result!.alreadyReached).toBe(false);
    expect(above.result![key]).toBeGreaterThan(0);
    expect(above.result!.endValue).toBeCloseTo(minimum * 1.2, 6);
  });

  it("is what is deposited when the interest rate is searched", () => {
    expect(minimumEndValue({ ...plan, output: "yearlyInterest" })).toBe(
      5_000 + 150 * 12 * 32,
    );
  });
});

describe("the yearly chart values", () => {
  it.each(["accumulating", "distributing"] as const)(
    "never fall while saving, with taxes: %s",
    (distributionType) => {
      const { result } = calculateSavings({
        ...plan,
        startValue: 0,
        durationYears: 30,
        considerTax: true,
        distributionType,
        partialExemption: 0,
      });
      const totals = result!.years.map((year) => year.deposits + year.interest);
      for (let i = 1; i < totals.length; i++) {
        expect(totals[i], `year ${i + 1}`).toBeGreaterThan(totals[i - 1]);
      }
      // The last column is the end value.
      expect(totals.at(-1)).toBeCloseTo(result!.endValue, 6);
    },
  );
});

describe("costs", () => {
  it("reduce the interest rate", () => {
    const withCosts = calculateSavings({ ...plan, costs: 1 });
    const lowerRate = calculateSavings({ ...plan, yearlyInterest: plan.yearlyInterest - 1 });
    expect(withCosts.result!.endValue).toBeCloseTo(lowerRate.result!.endValue, 8);
    expect(withCosts.result!.endValue).toBeLessThan(calculateSavings(plan).result!.endValue);
    // The result still names the rate before the costs.
    expect(withCosts.result!.yearlyInterest).toBeCloseTo(plan.yearlyInterest, 10);
  });

  it("change nothing at zero", () => {
    expect(calculateSavings({ ...plan, costs: 0 })).toEqual(calculateSavings(plan));
  });

  it("are added to the searched interest rate", () => {
    const target = calculateSavings({ ...plan, costs: 1.5 }).result!.endValue;
    const searched = calculateSavings({
      ...plan,
      output: "yearlyInterest",
      yearlyInterest: 0,
      costs: 1.5,
      endValue: target,
    });
    // The rate that leads to the end value, before the costs: the one we started with.
    expect(searched.result!.yearlyInterest).toBeCloseTo(plan.yearlyInterest, 4);
  });

  it("make the end value need more of the searched savings rate", () => {
    const cheap = calculateSavings({ ...plan, output: "savingRate", endValue: 400_000 });
    const costly = calculateSavings({ ...plan, output: "savingRate", endValue: 400_000, costs: 2 });
    expect(costly.result!.savingRate).toBeGreaterThan(cheap.result!.savingRate);
  });
});

describe("inflation", () => {
  it("is deducted from the interest rate, like costs", () => {
    const real = calculateSavings({ ...plan, inflation: 2 });
    const lowerRate = calculateSavings({ ...plan, yearlyInterest: plan.yearlyInterest - 2 });
    expect(real.result!.endValue).toBeCloseTo(lowerRate.result!.endValue, 8);
    expect(real.result!.endValue).toBeLessThan(calculateSavings(plan).result!.endValue);
    // The result still names the nominal rate.
    expect(real.result!.yearlyInterest).toBeCloseTo(plan.yearlyInterest, 10);
  });

  it("adds up with the costs", () => {
    const both = calculateSavings({ ...plan, costs: 1, inflation: 2 });
    const rate = calculateSavings({ ...plan, yearlyInterest: plan.yearlyInterest - 3 });
    expect(both.result!.endValue).toBeCloseTo(rate.result!.endValue, 8);
  });

  it("names the nominal rate that reaches a real goal", () => {
    const goal = calculateSavings({ ...plan, inflation: 2 }).result!.endValue;
    const searched = calculateSavings({
      ...plan,
      output: "yearlyInterest",
      yearlyInterest: 0,
      inflation: 2,
      endValue: goal,
    });
    expect(searched.result!.yearlyInterest).toBeCloseTo(plan.yearlyInterest, 4);
  });

  it("copes with a negative real rate, with and without tax", () => {
    for (const considerTax of [false, true]) {
      for (const distributionType of ["distributing", "accumulating"] as const) {
        const { result, errors } = calculateSavings({
          ...plan,
          yearlyInterest: 1,
          inflation: 3,
          considerTax,
          distributionType,
        });
        expect(errors).toEqual([]);
        expect(Number.isFinite(result!.endValue)).toBe(true);
        // Less than was paid in, and no tax credit on the loss.
        expect(result!.endValue).toBeLessThan(result!.deposits);
        if (considerTax) {
          const untaxed = calculateSavings({ ...plan, yearlyInterest: 1, inflation: 3 });
          expect(result!.endValue).toBeCloseTo(untaxed.result!.endValue, 6);
        }
      }
    }
  });
});
