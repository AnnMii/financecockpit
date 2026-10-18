import { describe, expect, it } from "vitest";
import { type AllSettings, defaultSettings } from "@/lib/settings/schema";
import { calculatePensionGap } from "./pension-gap";
import { toPensionGapInput, toSavingsInput } from "./registry";
import { calculateSavings } from "./savings";

function settings(patch: {
  linked: boolean;
  considerTax?: boolean;
  distributionType?: "distributing" | "accumulating";
  costs?: number;
  considerInflation?: boolean;
  currentCapital?: number;
}): AllSettings {
  const s = defaultSettings();
  return {
    ...s,
    shared: {
      ...s.shared,
      currentCapital: patch.currentCapital ?? 0,
      considerInflation: patch.considerInflation ?? false,
    },
    "pension-gap": { ...s["pension-gap"], savingsLikeCalculator: patch.linked },
    savings: {
      ...s.savings,
      considerTax: patch.considerTax ?? true,
      distributionType: patch.distributionType ?? "distributing",
      costs: patch.costs ?? 0,
      interestInterval: "monthly",
    },
  };
}

const gapOf = (s: AllSettings) => calculatePensionGap(toPensionGapInput(s));

describe("pension gap with the saving phase like the savings calculator", () => {
  it("gives a savings rate that the savings calculator turns into the needed capital", () => {
    for (const patch of [
      { considerTax: true, distributionType: "distributing" as const },
      { considerTax: true, distributionType: "accumulating" as const },
      { considerTax: false },
      { considerTax: true, costs: 0.5 },
      { considerTax: true, considerInflation: true },
    ]) {
      const s = settings({ linked: true, ...patch });
      const gap = gapOf(s);
      const savings = toSavingsInput({
        ...s,
        savings: {
          ...s.savings,
          output: "endValue",
          untilRetirement: true,
          savingsRateMonthly: gap.withConsumption.savingsRate,
          saveInterval: "monthly",
          realTerms: patch.considerInflation ?? false,
        },
      });
      const end = calculateSavings(savings).result!.endValue;
      expect(end, JSON.stringify(patch)).toBeCloseTo(gap.withConsumption.capital, -1);
    }
  });

  it("ends the chart's saving phase at the needed capital", () => {
    const gap = gapOf(settings({ linked: true }));
    const saving = gap.years.filter((y) => y.phase === "saving");
    expect(saving.at(-1)!.age).toBe(67);
    expect(saving.at(-1)!.capital).toBeCloseTo(gap.withConsumption.capital, -1);
    expect(gap.years.at(-1)!.capital).toBeCloseTo(0, -1);
  });

  it("follows the tax settings of the savings profile", () => {
    const taxed = gapOf(settings({ linked: true, considerTax: true })).withConsumption.savingsRate;
    const untaxed = gapOf(settings({ linked: true, considerTax: false })).withConsumption.savingsRate;
    expect(untaxed).toBeLessThan(taxed);
  });

  it("is the Finanzfluss calculation when not linked", () => {
    const gap = gapOf(settings({ linked: false }));
    expect(gap.withConsumption.capital).toBeCloseTo(200_002, 0);
    expect(gap.withConsumption.savingsRate).toBeCloseTo(237.5, 1);
  });

  it("needs no savings when the existing capital alone is enough", () => {
    const gap = gapOf(settings({ linked: true, currentCapital: 200_000 }));
    expect(gap.withConsumption.savingsRate).toBe(0);
  });
});
