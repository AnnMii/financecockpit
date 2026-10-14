import { describe, expect, it } from "vitest";
import {
  type AvDepotInput,
  CAREER_STARTER_BONUS,
  calculateAvDepot,
  validateAvDepotInput,
} from "./av-depot";

/**
 * Regression tests that run without the submodule. The expected values are
 * the test results of the original (github.com/finanzfluss/calculators at
 * commit dcc29a6), rounded to whole euros. The live comparison with the
 * original is test/upstream/av-depot.parity.test.ts.
 */

function sampleInput(overrides: Partial<AvDepotInput> = {}): AvDepotInput {
  return {
    currentYear: 2027,
    age: 35,
    retirementAge: 67,
    taxableIncomeSavingsPhase: 50_000,
    taxableIncomeRetirement: 20_000,
    savingsRate: 5_000,
    etfReturnRate: 7,
    avDepotCosts: 0.2,
    exemptionOrder: 1_000,
    taxSavingsMode: "secondaryDepot",
    baseRate: 3,
    oneTimePayout: 30,
    payoutReturnRate: 3,
    payoutUntilAge: 85,
    childBirthYears: [],
    ...overrides,
  };
}

const euros = (value: number) => Math.round(value);

// [AV-Szenario, normales Depot] am Ende jedes Beitragsjahres
const REFERENCE_CAPITAL_PER_YEAR = [
  [5812, 5000], [12020, 10350], [18650, 16075], [25732, 22200],
  [33296, 28754], [41376, 35766], [50005, 43270], [59222, 51299],
  [69067, 59890], [79582, 69082], [90813, 78914], [102809, 89396],
  [115622, 100571], [129307, 112484], [143924, 125186], [159536, 138727],
  [176212, 153164], [194023, 168555], [213047, 184965], [233367, 202459],
  [255070, 221110], [278251, 240994], [303011, 262193], [329457, 284793],
  [357704, 308888], [387874, 334577], [420099, 361964], [454518, 391162],
  [491281, 422290], [530548, 455477], [572488, 490858], [617285, 528579],
];

describe("calculateAvDepot", () => {
  it("reproduces the reference output for the standard inputs", () => {
    const result = calculateAvDepot(sampleInput());

    expect(
      result.years.map((y) => [euros(y.av.capitalEnd), euros(y.normal.capitalEnd)]),
    ).toEqual(REFERENCE_CAPITAL_PER_YEAR);

    expect(euros(result.av.finalCapital)).toBe(617_285);
    expect(euros(result.normal.finalCapital)).toBe(528_579);
    expect(euros(result.av.ownContributions)).toBe(160_000);

    const pick = (p: { gross: number; tax: number; net: number }) =>
      [p.gross, p.tax, p.net].map(euros);
    expect(pick(result.av.payout.firstYear)).toEqual([215_255, 52_862, 162_393]);
    expect(pick(result.normal.payout.firstYear)).toEqual([184_693, 16_103, 168_590]);
    expect(pick(result.av.payout.regularYear)).toEqual([30_069, 4_963, 25_106]);
    expect(pick(result.normal.payout.regularYear)).toEqual([26_119, 2_028, 24_091]);
    expect(pick(result.av.payout.total)).toEqual([726_434, 137_233, 589_200]);
    expect(pick(result.normal.payout.total)).toEqual([628_716, 50_579, 578_137]);
  });

  it.each([
    ["Kinderzulage", { childBirthYears: [2026, 2019] }, 637_769, 596_414, 578_137],
    ["Steuerersparnis konsumiert", { taxSavingsMode: "consume" }, 587_306, 554_239, 578_137],
    ["Steuerersparnis ins AV-Depot", { taxSavingsMode: "avDepot" }, 616_141, 584_016, 578_137],
    ["low income", { taxableIncomeSavingsPhase: 5_000 }, 587_306, 554_239, 600_373],
  ] as const)(
    "reproduces the reference: %s",
    (_name, overrides, avCapital, avNet, normalNet) => {
      const result = calculateAvDepot(
        sampleInput(overrides as Partial<AvDepotInput>),
      );
      expect(euros(result.av.finalCapital)).toBe(avCapital);
      expect(euros(result.av.payout.total.net)).toBe(avNet);
      expect(euros(result.normal.payout.total.net)).toBe(normalNet);
    },
  );

  it("does not tax an unsubsidized part when contributions stay below 1.800 €", () => {
    const result = calculateAvDepot(sampleInput({ savingsRate: 1_500 }));
    expect(euros(result.av.finalCapital)).toBe(232_451);
    expect(euros(result.av.payout.total.net)).toBe(200_469);
    expect(result.av.unsubsidizedCapital).toBe(0);
  });

  it("taxes the full gain for savings phases under 12 years", () => {
    const result = calculateAvDepot(sampleInput({ age: 64, retirementAge: 65 }));
    expect(euros(result.av.payout.total.net)).toBe(6_275);
  });

  it("pays the Berufseinsteigerbonus once to savers under 25", () => {
    const withBonus = calculateAvDepot(sampleInput({ age: 24, taxSavingsMode: "avDepot" }));
    const without = calculateAvDepot(sampleInput({ age: 25, taxSavingsMode: "avDepot" }));

    expect(withBonus.years[0].av.starterBonus).toBe(CAREER_STARTER_BONUS);
    expect(withBonus.years[1].av.starterBonus).toBe(0);
    expect(without.years[0].av.starterBonus).toBe(0);
    expect(
      withBonus.years[0].av.capitalEnd - without.years[0].av.capitalEnd,
    ).toBeCloseTo(CAREER_STARTER_BONUS, 6);
  });

  it("moves tax savings beyond the contribution cap into the secondary depot", () => {
    const common = { savingsRate: 13_680, taxableIncomeSavingsPhase: 100_000 };
    const viaAvDepot = calculateAvDepot(sampleInput({ ...common, taxSavingsMode: "avDepot" }));
    const viaSecondary = calculateAvDepot(sampleInput({ ...common, taxSavingsMode: "secondaryDepot" }));
    expect(viaAvDepot).toEqual(viaSecondary);
  });

  it("does not tax gains at payout that were already taxed as Vorabpauschale", () => {
    const result = calculateAvDepot(
      sampleInput({ etfReturnRate: 1.4, avDepotCosts: 0, baseRate: 2, exemptionOrder: 0 }),
    );
    expect(result.years[1].normal.vorabpauschaleTax).toBeGreaterThan(0);
    expect(result.normal.payout.firstYear.tax).toBe(0);
  });

  it("splits the final capital into contributions, subsidies and gains", () => {
    for (const taxSavingsMode of ["avDepot", "secondaryDepot", "consume"] as const) {
      const { av, years } = calculateAvDepot(sampleInput({ taxSavingsMode }));
      expect(
        av.ownContributions + av.allowances + av.investedTaxSavings + av.gains,
      ).toBeCloseTo(av.finalCapital, 6);
      const last = years[years.length - 1].av;
      expect(
        last.cumulativeOwnContributions + last.cumulativeSubsidies + last.cumulativeGains,
      ).toBeCloseTo(av.finalCapital, 6);
    }
  });
});

describe("validateAvDepotInput", () => {
  it("accepts the standard inputs", () => {
    expect(validateAvDepotInput(sampleInput())).toEqual([]);
  });

  it("rejects inputs outside the model", () => {
    expect(validateAvDepotInput(sampleInput({ age: 68 }))).not.toEqual([]);
    expect(validateAvDepotInput(sampleInput({ savingsRate: 100 }))).not.toEqual([]);
    expect(validateAvDepotInput(sampleInput({ avDepotCosts: 3 }))).not.toEqual([]);
    expect(validateAvDepotInput(sampleInput({ retirementAge: 72 }))).not.toEqual([]);
  });
});
