import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/schema";
import { calculatePensionGap } from "./pension-gap";
import { toPensionGapInput } from "./registry";

function gapWith(currentCapital: number, considerInflation: boolean) {
  const s = defaultSettings();
  s.shared = { ...s.shared, currentCapital, considerInflation };
  return calculatePensionGap(toPensionGapInput(s));
}

describe("existing capital beyond what is needed", () => {
  it("needs no savings, and the payout does not use the capital up", () => {
    const result = gapWith(100_000, false);
    expect(result.gap).toBeGreaterThan(0);
    expect(result.withConsumption.savingsRate).toBe(0);
    const atRetirement = result.years.filter((y) => y.phase === "saving").at(-1)!.capital;
    expect(atRetirement).toBeGreaterThan(result.withConsumption.capital);
    // Capital is left at the end, so the green bars stay high.
    expect(result.years.at(-1)!.capital).toBeGreaterThan(result.withConsumption.capital);
  });

  it("is used up exactly at the end when it is just what is needed", () => {
    const result = gapWith(0, false);
    expect(result.withConsumption.savingsRate).toBeGreaterThan(0);
    expect(result.years.at(-1)!.capital).toBeCloseTo(0, 0);
  });
});
