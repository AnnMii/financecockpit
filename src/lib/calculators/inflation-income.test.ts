import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/schema";
import { inflationFactorToRetirement, toAvDepotInput, toPlanInput } from "./registry";

function settings(considerInflation: boolean) {
  const s = defaultSettings();
  return {
    ...s,
    shared: {
      ...s.shared,
      age: 40,
      retirementAge: 67,
      inflationRate: 2,
      taxableIncomeRetirement: 20_000,
      considerInflation,
    },
  };
}

describe("income in retirement and inflation", () => {
  const factor = 1.02 ** 27;

  it("brings today's money to the year of retirement", () => {
    expect(inflationFactorToRetirement(settings(true).shared)).toBeCloseTo(factor);
    expect(inflationFactorToRetirement({ age: 67, retirementAge: 67, inflationRate: 2 })).toBe(1);
  });

  it("is used unchanged in the AV-Depot calculator without the switch", () => {
    expect(toAvDepotInput(settings(false)).taxableIncomeRetirement).toBe(20_000);
  });

  it("is raised to the year of retirement with the switch", () => {
    expect(toAvDepotInput(settings(true)).taxableIncomeRetirement).toBeCloseTo(20_000 * factor);
  });

  it("is always raised in the overall plan", () => {
    for (const on of [false, true]) {
      const input = toPlanInput(settings(on));
      expect(input.avDepot?.taxableIncomeRetirement).toBeCloseTo(20_000 * factor);
    }
  });

  it("leaves the income in the saving phase alone", () => {
    expect(toAvDepotInput(settings(true)).taxableIncomeSavingsPhase).toBe(
      settings(true).shared.taxableIncomeSavingsPhase,
    );
  });
});
