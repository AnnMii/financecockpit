import { describe, expect, it } from "vitest";
import { type PensionGapInput, calculatePensionGap } from "./pension-gap";
import { calculateRetirementOverview } from "./retirement-overview";

const input: PensionGapInput = {
  statePension: 950,
  companyPension: 100,
  privatePension: 0,
  riesterPension: 0,
  taxPrediction: 15,
  yearlyTaxFreeAmount: 12_348,
  desiredPension: 2_200,
  age: 30,
  retirementAge: 67,
  payoutUntilAge: 100,
  currentCapital: 0,
  returnUntilRetirement: 5,
  retirementReturn: 3,
  considerInflation: false,
  inflationRate: 2,
  capitalGainsTax: 26.375,
};

describe("calculateRetirementOverview", () => {
  it("equals the Rentenlücke calculator without an AV-Depot pension", () => {
    const gap = calculatePensionGap(input);
    const overview = calculateRetirementOverview(input, 0);
    expect(overview.remainingGap).toBeCloseTo(gap.gap, 8);
    expect(overview.closing).toEqual(gap.withConsumption);
    expect(overview.avDepotPension).toBe(0);
  });

  it("subtracts the AV-Depot pension from the gap", () => {
    const gap = calculatePensionGap(input);
    const overview = calculateRetirementOverview(input, 500);
    expect(overview.avDepotPension).toBe(500);
    expect(overview.remainingGap).toBeCloseTo(gap.gap - 500, 8);
    expect(overview.closing.capital).toBeLessThan(gap.withConsumption.capital);
    expect(
      overview.netPension + overview.avDepotPension + overview.remainingGap,
    ).toBeCloseTo(overview.desiredPension, 8);
  });

  it("counts no more of the AV-Depot pension than the gap needs", () => {
    const overview = calculateRetirementOverview(input, 5_000);
    expect(overview.remainingGap).toBe(0);
    expect(overview.closing).toEqual({ capital: 0, savingsRate: 0 });
    expect(overview.netPension + overview.avDepotPension).toBeCloseTo(2_200, 8);
  });
});
