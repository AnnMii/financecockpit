import { describe, expect, it } from "vitest";
import fixture from "../../../test/fixtures/pension-gap.json";
import { parseGerman, tolerance } from "./fixtures";
import {
  type PensionGapInput,
  calculatePensionGap,
  validatePensionGapInput,
} from "./pension-gap";

type Params = (typeof fixture.cases)[number]["params"];

function toInput(params: Params): PensionGapInput {
  return {
    statePension: params.inputStatePension,
    companyPension: params.inputCompanyPension,
    privatePension: params.inputPrivatePension,
    riesterPension: params.inputRiesterPension,
    taxPrediction: params.inputTaxPrediction,
    yearlyTaxFreeAmount: params.inputYearlyTaxlessValue,
    desiredPension: params.inputDesiredPension,
    age: params.inputYourAge,
    retirementAge: params.inputPensionEntryAge,
    payoutUntilAge: params.inputExpectedLifeTime,
    currentCapital: params.inputYourCapital,
    returnUntilRetirement: params.inputExpectedInterestTilPension,
    retirementReturn: params.inputExpectedInterest,
    considerInflation: params.inputRespectInflation,
    inflationRate: params.inputInflationRate,
    capitalGainsTax: params.inputTaxOfIncome,
  };
}

const standard = toInput(fixture.cases[0].params);

describe("calculatePensionGap", () => {
  // Answers of the Finanzfluss calculator, see scripts/upstream-check-api.mjs
  it.each(fixture.cases)(
    "matches the Finanzfluss calculator: $name",
    ({ params, expected }) => {
      const result = calculatePensionGap(toInput(params));
      const close = (actual: number, recorded: string) =>
        expect(Math.abs(actual - parseGerman(recorded))).toBeLessThanOrEqual(
          tolerance(recorded),
        );

      close(result.grossPension, expected.outputGrossPension);
      close(result.netPension, expected.outputNetPension);
      close(result.gap, expected.outputPensionDeficit);
      close(result.withConsumption.capital, expected.outputCapitalWithCapitalConsuming);
      close(result.withConsumption.savingsRate, expected.outputSaveRateWithConsuming);
      close(
        result.withoutConsumption!.capital,
        expected.outputCapitalWithoutCapitalConsuming,
      );
      close(
        result.withoutConsumption!.savingsRate,
        expected.outputSaveRateWithoutConsuming,
      );
      expect(result.yearsUntilRetirement).toBe(Number(expected.outputYearsTilPension));
      expect(result.payoutYears).toBe(
        Number(expected.outputPensionLifetimeDifference),
      );
    },
  );

  it("handles a return of exactly zero", () => {
    const result = calculatePensionGap({
      ...standard,
      taxPrediction: 0,
      retirementReturn: 0,
      returnUntilRetirement: 0,
    });
    // 1.150 € for 33 years, saved over 37 years without interest
    expect(result.withConsumption.capital).toBeCloseTo(1_150 * 12 * 33, 6);
    expect(result.withConsumption.savingsRate).toBeCloseTo((1_150 * 33) / 37, 6);
    expect(result.withoutConsumption).toBeNull();
  });

  it("cannot live off interest when inflation eats the return", () => {
    const result = calculatePensionGap({
      ...standard,
      considerInflation: true,
      inflationRate: 4,
    });
    expect(result.withoutConsumption).toBeNull();
    expect(result.withConsumption.capital).toBeGreaterThan(0);
  });

  it("needs no saving when the capital already grows to the target", () => {
    const result = calculatePensionGap({ ...standard, currentCapital: 500_000 });
    expect(result.withConsumption.savingsRate).toBe(0);
  });

  it("builds the capital up to the target and uses it up by the end", () => {
    const result = calculatePensionGap(standard);
    const atRetirement = result.years.find(
      (y) => y.age === standard.retirementAge,
    )!;
    expect(atRetirement.capital).toBeCloseTo(result.withConsumption.capital, 4);
    expect(result.years.at(-1)).toMatchObject({ age: 100, phase: "payout" });
    expect(result.years.at(-1)!.capital).toBeLessThan(0.01);
    expect(result.years).toHaveLength(100 - 30);
  });
});

describe("validatePensionGapInput", () => {
  it("accepts the standard inputs", () => {
    expect(validatePensionGapInput(standard)).toEqual([]);
  });

  it("rejects ages that leave no saving or payout phase", () => {
    expect(validatePensionGapInput({ ...standard, age: 67 })).not.toEqual([]);
    expect(
      validatePensionGapInput({ ...standard, payoutUntilAge: 67 }),
    ).not.toEqual([]);
  });
});
