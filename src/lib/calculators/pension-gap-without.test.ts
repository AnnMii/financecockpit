import { describe, expect, it } from "vitest";
import { type AllSettings, defaultSettings } from "@/lib/settings/schema";
import { calculatePensionGap } from "./pension-gap";
import { toPensionGapInput } from "./registry";

const gapOf = (patch: (s: AllSettings) => void) => {
  const s = defaultSettings();
  patch(s);
  return calculatePensionGap(toPensionGapInput(s));
};

describe("the course without capital consumption", () => {
  it("reaches the needed capital at retirement and then stays there", () => {
    const gap = gapOf(() => {});
    const years = gap.yearsWithoutConsumption!;
    const needed = gap.withoutConsumption!.capital;
    const atRetirement = years.filter((y) => y.phase === "saving").at(-1)!;
    expect(atRetirement.age).toBe(67);
    expect(atRetirement.capital).toBeCloseTo(needed, -1);
    for (const year of years.filter((y) => y.phase === "payout")) {
      expect(year.capital).toBeCloseTo(needed, -1);
    }
  });

  it("is a different course from the one that uses the capital up", () => {
    const gap = gapOf(() => {});
    expect(gap.years.at(-1)!.capital).toBeCloseTo(0, -1);
    expect(gap.yearsWithoutConsumption!.at(-1)!.capital).toBeGreaterThan(100_000);
  });

  it("does not exist when the interest in retirement is not enough", () => {
    const gap = gapOf((s) => {
      s.shared.retirementReturn = 1;
      s.shared.inflationRate = 3;
      s.shared.considerInflation = true;
    });
    expect(gap.withoutConsumption).toBeNull();
    expect(gap.yearsWithoutConsumption).toBeNull();
  });

  it("works with the saving phase like the savings calculator", () => {
    const gap = gapOf((s) => {
      s["pension-gap"].savingsLikeCalculator = true;
      s.savings.considerTax = true;
    });
    const needed = gap.withoutConsumption!.capital;
    const atRetirement = gap.yearsWithoutConsumption!.filter((y) => y.phase === "saving").at(-1)!;
    expect(atRetirement.capital).toBeCloseTo(needed, -1);
  });
});
