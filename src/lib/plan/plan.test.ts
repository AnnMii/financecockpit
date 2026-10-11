import { describe, expect, it } from "vitest";
import { type AvDepotInput, calculateAvDepot } from "@/lib/calculators/av-depot";
import { calculatePensionGap } from "@/lib/calculators/pension-gap";
import { type PlanInput, calculatePlan, validatePlanInput } from "./plan";
import {
  type PlanVersion,
  type Snapshot,
  analyseDeviation,
  priceFactor,
  withAssumptionsOf,
  yearsBetween,
} from "./tracking";

const pension = {
  statePension: 950,
  companyPension: 100,
  privatePension: 0,
  riesterPension: 0,
  taxPrediction: 15,
  yearlyTaxFreeAmount: 12_348,
  desiredPension: 2_200,
};

/** Depot only, as the Rentenlücke calculator sees it with inflation switched on. */
function depotPlan(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    age: 35,
    retirementAge: 67,
    payoutUntilAge: 85,
    inflationRate: 2,
    expectedReturn: 6,
    retirementReturn: 3,
    cashReturn: 2,
    capitalGainsTax: 26.375,
    depotVolatility: 15,
    cashVolatility: 1,
    pension,
    rates: { av: 0, depot: 300, cash: 0 },
    values: { av: 0, depot: 0, cash: 0 },
    avDepot: null,
    confidenceTarget: 85,
    lowerGuardrail: 75,
    upperGuardrail: 95,
    ...overrides,
  };
}

const avInput: AvDepotInput = {
  currentYear: 2027,
  age: 35,
  retirementAge: 67,
  zveSavingsPhase: 50_000,
  zveRetirement: 20_000,
  savingsRate: 1_800,
  etfReturnRate: 6,
  avDepotCosts: 0.2,
  exemptionOrder: 1_000,
  taxSavingsMode: "avDepot",
  baseRate: 0,
  oneTimePayout: 0,
  payoutReturnRate: 3,
  payoutUntilAge: 85,
  childBirthYears: [],
};

describe("calculatePlan without fluctuation", () => {
  const calm = { depotVolatility: 0, cashVolatility: 0 };

  it("needs the savings rate the Rentenlücke calculator gives", () => {
    const gap = calculatePensionGap({
      ...pension,
      age: 35,
      retirementAge: 67,
      payoutUntilAge: 85,
      currentCapital: 0,
      returnUntilRetirement: 6,
      retirementReturn: 3,
      considerInflation: true,
      inflationRate: 2,
      capitalGainsTax: 26.375,
    });
    const plan = calculatePlan(depotPlan(calm));
    expect(plan.requiredRate).toBeCloseTo(gap.withConsumption.savingsRate, 6);
    expect(plan.netPension).toBeCloseTo(gap.netPension, 8);
  });

  it("reaches exactly the desired pension with the required rate", () => {
    const required = calculatePlan(depotPlan(calm)).requiredRate;
    const plan = calculatePlan(
      depotPlan({ ...calm, rates: { av: 0, depot: required, cash: 0 } }),
    );
    expect(plan.pension.p50).toBeCloseTo(2_200, 6);
    expect(plan.probability).toBe(1);
  });

  it("has no corridor: every course is the expected one", () => {
    const plan = calculatePlan(depotPlan(calm));
    for (const year of plan.years) {
      expect(year.p10).toBeCloseTo(year.expected, 6);
      expect(year.p90).toBeCloseTo(year.expected, 6);
    }
    expect(plan.years[0]).toMatchObject({ age: 35, expected: 0 });
    expect(plan.years.at(-1)!.age).toBe(67);
  });

  it("counts existing wealth and Tagesgeld savings", () => {
    const without = calculatePlan(depotPlan(calm));
    const withWealth = calculatePlan(
      depotPlan({
        ...calm,
        values: { av: 0, depot: 20_000, cash: 5_000 },
        rates: { av: 0, depot: 300, cash: 50 },
      }),
    );
    expect(withWealth.years[0].expected).toBe(25_000);
    expect(withWealth.wealthAtRetirement.p50).toBeGreaterThan(
      without.wealthAtRetirement.p50 + 25_000,
    );
    expect(withWealth.requiredRate - 50).toBeLessThan(without.requiredRate);
  });

  it("adds the AV-Depot with its own rules, in today's money", () => {
    const av = calculateAvDepot(avInput);
    const plan = calculatePlan(
      depotPlan({ ...calm, rates: { av: 150, depot: 0, cash: 0 }, avDepot: avInput }),
    );
    const deflate = 1.02 ** 32;
    expect(plan.wealthAtRetirement.p50).toBeCloseTo(av.av.finalCapital / deflate, 4);
    expect(plan.pension.p50).toBeCloseTo(
      plan.netPension + av.av.payout.monthlyNet / deflate,
      6,
    );
  });
});

describe("calculatePlan with fluctuation", () => {
  it("orders pessimistic, expected and optimistic courses", () => {
    const plan = calculatePlan(depotPlan());
    for (const year of plan.years.slice(1)) {
      expect(year.p10).toBeLessThan(year.p50);
      expect(year.p50).toBeLessThan(year.p90);
    }
    expect(plan.pension.p10).toBeLessThan(plan.pension.p90);
    expect(plan.probability).toBeGreaterThan(0);
    expect(plan.probability).toBeLessThan(1);
  });

  it("keeps the expected course independent of the fluctuation", () => {
    const calm = calculatePlan(depotPlan({ depotVolatility: 0, cashVolatility: 0 }));
    const volatile = calculatePlan(
      depotPlan({ rates: { av: 150, depot: 150, cash: 0 }, avDepot: avInput }),
    );
    const calmWithAv = calculatePlan(
      depotPlan({
        rates: { av: 150, depot: 150, cash: 0 },
        avDepot: avInput,
        depotVolatility: 0,
        cashVolatility: 0,
      }),
    );
    expect(calculatePlan(depotPlan()).years.map((y) => y.expected)).toEqual(
      calm.years.map((y) => y.expected),
    );
    expect(volatile.years.map((y) => y.expected)).toEqual(
      calmWithAv.years.map((y) => y.expected),
    );
    // The middle course lies below the expected one: gains compound, losses do not.
    expect(volatile.years.at(-1)!.p50).toBeLessThan(volatile.years.at(-1)!.expected);
    // In the first year only the payments of that year fluctuate.
    expect(volatile.years[1].p10).toBeLessThan(volatile.years[1].p90);
  });

  it("gives the same numbers for the same plan", () => {
    expect(calculatePlan(depotPlan())).toEqual(calculatePlan(depotPlan()));
    expect(calculatePlan(depotPlan({ seed: 1 })).probability).not.toBe(
      calculatePlan(depotPlan({ seed: 2 })).probability,
    );
  });

  it("never needs less savings for more confidence", () => {
    const rates = [50, 70, 85, 95].map(
      (confidenceTarget) =>
        calculatePlan(
          depotPlan({ confidenceTarget, lowerGuardrail: 1, upperGuardrail: 99.5 }),
        ).requiredRate,
    );
    expect(rates[0]).toBeLessThan(rates[1]);
    expect(rates[1]).toBeLessThan(rates[2]);
    expect(rates[2]).toBeLessThan(rates[3]);
  });

  it("reaches the confidence target with the required rate", () => {
    const required = calculatePlan(depotPlan()).requiredRate;
    const plan = calculatePlan(
      depotPlan({ rates: { av: 0, depot: required, cash: 0 } }),
    );
    expect(plan.probability).toBeCloseTo(0.85, 2);
    expect(plan.status).toBe("onTrack");
  });

  it("asks for more savings below the lower guardrail", () => {
    const plan = calculatePlan(depotPlan({ rates: { av: 0, depot: 50, cash: 0 } }));
    expect(plan.status).toBe("increase");
    expect(plan.amount).toBeCloseTo(plan.requiredRate - 50, 6);
    expect(plan.alternatives!.lowerDesiredPensionBy).toBeGreaterThan(0);
  });

  it("offers a later retirement when that is enough", () => {
    const required = calculatePlan(depotPlan()).requiredRate;
    const plan = calculatePlan(
      depotPlan({ rates: { av: 0, depot: required * 0.75, cash: 0 } }),
    );
    expect(plan.status).toBe("increase");
    expect(plan.alternatives!.retireYearsLater).toBeGreaterThanOrEqual(1);
  });

  it("shows room above the upper guardrail", () => {
    const plan = calculatePlan(
      depotPlan({ rates: { av: 0, depot: 3_000, cash: 0 } }),
    );
    expect(plan.status).toBe("room");
    expect(plan.amount).toBeCloseTo(3_000 - plan.requiredRate, 6);
    expect(plan.alternatives).toBeNull();
  });
});

describe("validatePlanInput", () => {
  it("accepts the sample plan", () => {
    expect(validatePlanInput(depotPlan())).toEqual([]);
  });

  it("rejects guardrails that do not surround the target", () => {
    expect(validatePlanInput(depotPlan({ lowerGuardrail: 90 }))).toContain(
      "planGuardrailOrder",
    );
  });

  it("rejects shares above 100 % and passes on AV-Depot problems", () => {
    expect(
      validatePlanInput(depotPlan({ rates: { av: 200, depot: -50, cash: 0 } })),
    ).toContain("planSharesOver100");
    expect(
      validatePlanInput(depotPlan({ avDepot: { ...avInput, payoutUntilAge: 80 } })),
    ).toContain("avPayoutMin85");
  });
});

describe("tracking a frozen plan", () => {
  const input = depotPlan({
    depotVolatility: 0,
    cashVolatility: 0,
    values: { av: 0, depot: 10_000, cash: 0 },
    rates: { av: 0, depot: 100, cash: 0 },
  });
  const version: PlanVersion = {
    id: "v1",
    date: "2026-01-01",
    label: "Plan 2026",
    input,
    result: calculatePlan(depotPlan({ ...input, depotVolatility: 15 })),
  };
  const snapshot = (overrides: Partial<Snapshot>): Snapshot => ({
    id: "s1",
    date: "2027-01-01",
    values: { av: 0, depot: 12_320, cash: 0 },
    contributions: { av: 0, depot: 1_200, cash: 0 },
    inflation: null,
    note: "",
    kpis: null,
    ...overrides,
  });

  it("measures time in years", () => {
    expect(yearsBetween("2026-01-01", "2027-01-01")).toBeCloseTo(1, 2);
    expect(yearsBetween("2026-01-01", "2031-01-01")).toBeCloseTo(5, 2);
  });

  it("uses entered inflation and the plan's assumption otherwise", () => {
    const first = snapshot({ inflation: 5 });
    const second = snapshot({ id: "s2", date: "2028-01-01" });
    expect(priceFactor(version, [first, second], "2027-01-01")).toBeCloseTo(1.05, 3);
    expect(priceFactor(version, [first, second], "2028-01-01")).toBeCloseTo(
      1.05 * 1.02,
      3,
    );
  });

  it("splits the deviation into contributions and market", () => {
    const s = snapshot({});
    const result = analyseDeviation(version, s, [s]);
    expect(result.age).toBeCloseTo(36, 2);
    expect(result.actual).toBeCloseTo(12_320 / 1.02, 0);
    // 365 days are a touch less than a year of 365.25
    expect(result.plannedContributions).toBeCloseTo(1_200, -1);
    expect(result.contributionEffect).toBeCloseTo(0, -1);
    expect(result.contributionEffect + result.marketEffect).toBeCloseTo(
      result.deviation,
      8,
    );
    // 1.120 € gain on 10.000 € plus half of the 1.200 € paid in
    expect(result.actualReturn).toBeCloseTo((1_120 / 10_600) * 100, 1);
    expect(result.assumedReturn).toBe(6);
  });

  it("attributes extra payments to contributions, not to the market", () => {
    const base = snapshot({});
    const more = snapshot({
      values: { av: 0, depot: 14_320, cash: 0 },
      contributions: { av: 0, depot: 3_200, cash: 0 },
    });
    const baseResult = analyseDeviation(version, base, [base]);
    const moreResult = analyseDeviation(version, more, [more]);
    expect(moreResult.contributionEffect).toBeCloseTo(2_000 / 1.02, -1);
    expect(moreResult.marketEffect).toBeCloseTo(baseResult.marketEffect, 0);
  });

  it("places a crash below and a boom above the frozen corridor", () => {
    const expected = version.result.years[5].expected * 1.02 ** 5;
    const at = (factor: number) => {
      const s = snapshot({
        date: "2031-01-01",
        values: { av: 0, depot: expected * factor, cash: 0 },
      });
      return analyseDeviation(version, s, [s]).position;
    };
    expect(at(1)).toBe("inside");
    expect(at(0.5)).toBe("below");
    expect(at(2)).toBe("above");
  });

  it("can replay today's plan with the frozen assumptions", () => {
    const today = depotPlan({ expectedReturn: 4, inflationRate: 3, age: 36 });
    const replay = withAssumptionsOf(today, version);
    expect(replay).toMatchObject({ expectedReturn: 6, inflationRate: 2, age: 36 });
  });
});
