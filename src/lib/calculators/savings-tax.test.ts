import { describe, expect, it } from "vitest";
import { type SavingsInput, calculateSavings, withoutTax } from "./savings";

const base: SavingsInput = {
  output: "endValue",
  startValue: 0,
  savingRate: 237.5,
  saveInterval: "monthly",
  yearlyInterest: 6,
  interestInterval: "monthly",
  durationYears: 32,
  endValue: 0,
  considerTax: true,
  capitalGainsTax: 26.375,
  distributionType: "accumulating",
  partialExemption: 0,
};

describe("withoutTax", () => {
  it("accumulating: the tax is once on the whole gain", () => {
    const taxed = calculateSavings(base).result!;
    const untaxed = withoutTax(base, taxed)!;
    expect(untaxed.endValue).toBeCloseTo(276_320, -1);
    const gain = untaxed.endValue - taxed.deposits;
    expect(untaxed.endValue - taxed.endValue).toBeCloseTo(gain * 0.26375, 0);
  });

  it("distributing: the taxes reduce the compounding, so they cost more", () => {
    const accumulating = calculateSavings(base).result!;
    const distributing = calculateSavings({ ...base, distributionType: "distributing" }).result!;
    const untaxed = withoutTax(base, distributing)!;
    expect(untaxed.endValue).toBeCloseTo(276_320, -1);
    expect(untaxed.endValue - distributing.endValue).toBeGreaterThan(
      untaxed.endValue - accumulating.endValue,
    );
  });

  it("works when something else was searched for", () => {
    const wanted = calculateSavings(base).result!.endValue;
    const searched = calculateSavings({ ...base, output: "savingRate", savingRate: 0, endValue: wanted }).result!;
    const untaxed = withoutTax({ ...base, output: "savingRate", endValue: wanted }, searched)!;
    expect(untaxed.endValue).toBeCloseTo(276_320, -1);
  });

  it("has a course that ends where the end value is", () => {
    const taxed = calculateSavings(base).result!;
    const untaxed = withoutTax(base, taxed)!;
    const last = untaxed.years.at(-1)!;
    expect(last.deposits + last.interest).toBeCloseTo(untaxed.endValue, 0);
  });
});
