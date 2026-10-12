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

    // Below it nothing of the searched figure is needed: the answer is zero.
    const below = calculateSavings({ ...plan, output, endValue: minimum * 0.9 });
    expect(below.errors).toEqual([]);
    expect(below.result!.alreadyReached).toBe(true);
    expect(below.result![key]).toBe(0);
    expect(below.result!.endValue).toBeCloseTo(minimum, 6);

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
