import { describe, expect, it } from "vitest";
import { calculatePlan, validatePlanInput } from "@/lib/plan/plan";
import { createRandom } from "@/lib/plan/random";
import {
  type AllSettings,
  type NumberFieldSpec,
  SETTINGS_SCOPES,
  defaultSettings,
  numberFields,
  selectFields,
  toggleFields,
} from "@/lib/settings/schema";
import { calculateAvDepot, validateAvDepotInput } from "./av-depot";
import { calculatePensionGap, validatePensionGapInput } from "./pension-gap";
import {
  toAvDepotInput,
  toPensionGapInput,
  toPlanInput,
  toSavingsInput,
  toWithdrawalPlanInput,
} from "./registry";
import { calculateSavings } from "./savings";
import {
  calculateWithdrawalPlan,
  validateWithdrawalPlanInput,
} from "./withdrawal-plan";

/**
 * Whatever a user can enter, a calculator either names the reason why it
 * cannot calculate or returns numbers that can be shown.
 */

/** Settings with every field somewhere in its allowed range. */
function randomSettings(random: () => number): AllSettings {
  const settings = defaultSettings() as unknown as Record<
    string,
    Record<string, unknown>
  >;
  for (const scope of SETTINGS_SCOPES) {
    for (const [key, spec] of Object.entries<NumberFieldSpec>(numberFields[scope])) {
      // Mostly realistic values, sometimes the edges of the range.
      const edge = random();
      const max = edge < 0.1 ? spec.max : Math.min(spec.max, spec.default * 4 + 10);
      const value =
        edge > 0.95 ? spec.min : spec.min + random() * (Math.max(spec.min, max) - spec.min);
      settings[scope][key] = spec.integer ? Math.round(value) : value;
    }
    for (const key of Object.keys(toggleFields[scope])) {
      settings[scope][key] = random() < 0.5;
    }
    for (const [key, options] of Object.entries<readonly string[]>(selectFields[scope])) {
      settings[scope][key] = options[Math.floor(random() * options.length)];
    }
  }
  settings.shared.childBirthYears = Array.from(
    { length: Math.floor(random() * 3) },
    () => 2000 + Math.floor(random() * 40),
  );
  return settings as unknown as AllSettings;
}

/** Paths of all numbers in `value` that are NaN or infinite. */
function brokenNumbers(value: unknown, path = ""): string[] {
  if (typeof value === "number") return Number.isFinite(value) ? [] : [path];
  if (ArrayBuffer.isView(value)) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => brokenNumbers(item, `${path}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      brokenNumbers(item, `${path}.${key}`),
    );
  }
  return [];
}

const RUNS = 600;

describe("calculators with arbitrary settings", () => {
  it("never show NaN, infinite or negative amounts", () => {
    const random = createRandom(7);
    const calculated = { av: 0, gap: 0, savings: 0, withdrawal: 0 };
    for (let run = 0; run < RUNS; run++) {
      const settings = randomSettings(random);
      // Half of the runs stay inside what the Altersvorsorgedepot covers.
      if (run % 2 === 0) {
        settings.shared.age = 18 + Math.floor(random() * 47);
        settings.shared.retirementAge = 65 + Math.floor(random() * 6);
        settings.shared.payoutUntilAge = 85 + Math.floor(random() * 20);
        settings["av-depot"].savingsRateMonthly = 10 + random() * 1_100;
      }
      const context = JSON.stringify(settings);

      const av = toAvDepotInput(settings);
      if (validateAvDepotInput(av).length === 0) {
        calculated.av++;
        const result = calculateAvDepot({ ...av, currentYear: 2027 });
        expect(brokenNumbers(result), context).toEqual([]);
        expect(result.av.finalCapital, context).toBeGreaterThanOrEqual(0);
        expect(result.av.payout.monthlyNet, context).toBeGreaterThanOrEqual(0);
        expect(result.normal.payout.monthlyNet, context).toBeGreaterThanOrEqual(0);
      }

      const gap = toPensionGapInput(settings);
      if (validatePensionGapInput(gap).length === 0) {
        calculated.gap++;
        const result = calculatePensionGap(gap);
        expect(brokenNumbers(result), context).toEqual([]);
        expect(result.gap, context).toBeGreaterThanOrEqual(0);
        expect(result.withConsumption.capital, context).toBeGreaterThanOrEqual(0);
        expect(result.withConsumption.savingsRate, context).toBeGreaterThanOrEqual(0);
        for (const year of result.years) {
          expect(year.capital, context).toBeGreaterThanOrEqual(0);
        }
      }

      const savingsInput = toSavingsInput(settings);
      const savings = calculateSavings(savingsInput);
      expect(brokenNumbers(savings.result), context).toEqual([]);
      expect(savings.result === null, context).toBe(savings.errors.length > 0);
      if (savings.result) {
        calculated.savings++;
        // Whatever was searched: the figures of the result lead to its end value.
        const { startValue, savingRate, yearlyInterest, durationYears, endValue } =
          savings.result;
        const back = calculateSavings({
          ...savingsInput,
          output: "endValue",
          startValue,
          savingRate,
          yearlyInterest,
          durationYears,
        });
        if (durationYears > 0) {
          expect(
            Math.abs(back.result!.endValue - endValue),
            context,
          ).toBeLessThanOrEqual(0.02 + 1e-6 * endValue);
        }
        for (const key of ["startValue", "savingRate", "durationYears", "endValue"] as const) {
          expect(savings.result[key], `${key} ${context}`).toBeGreaterThanOrEqual(0);
        }
      }

      const withdrawal = toWithdrawalPlanInput(settings);
      if (validateWithdrawalPlanInput(withdrawal).length === 0) {
        calculated.withdrawal++;
        const result = calculateWithdrawalPlan(withdrawal);
        expect(brokenNumbers(result), context).toEqual([]);
        expect(result.amount, context).toBeGreaterThanOrEqual(0);
        expect(result.capital, context).toBeGreaterThanOrEqual(0);
        for (const year of result.years) {
          expect(year.capital, context).toBeGreaterThanOrEqual(0);
        }
      }
    }
    // The checks above only count when enough settings could be calculated.
    for (const count of Object.values(calculated)) {
      expect(count).toBeGreaterThan(RUNS / 10);
    }
  }, 60_000);

  it("gives the Gesamtplan numbers that can be shown", () => {
    const random = createRandom(11);
    let calculated = 0;
    for (let run = 0; run < 150; run++) {
      const settings = randomSettings(random);
      settings.shared.age = 18 + Math.floor(random() * 47);
      settings.shared.retirementAge = 65 + Math.floor(random() * 6);
      settings.shared.payoutUntilAge = 85 + Math.floor(random() * 20);
      settings.plan.lowerGuardrail = 50 + random() * 20;
      settings.plan.confidenceTarget = 75 + random() * 10;
      settings.plan.upperGuardrail = 90 + random() * 10;
      settings["av-depot"].savingsRateMonthly = 10 + random() * 400;
      settings.savings.savingsRateMonthly = random() * 800;
      settings.plan.cashMonthly = random() * 200;
      const context = JSON.stringify(settings);
      const input = {
        ...toPlanInput(settings, {
          av: random() < 0.5 ? 0 : random() * 50_000,
          depot: random() < 0.5 ? 0 : random() * 200_000,
          cash: random() < 0.5 ? 0 : random() * 50_000,
        }),
        paths: 120,
      };
      if (validatePlanInput(input).length > 0) continue;
      calculated++;
      const result = calculatePlan(input);
      expect(brokenNumbers(result), context).toEqual([]);
      expect(result.probability, context).toBeGreaterThanOrEqual(0);
      expect(result.probability, context).toBeLessThanOrEqual(1);
      expect(result.requiredRate, context).toBeGreaterThanOrEqual(0);
      for (const year of result.years) {
        expect(year.p10, context).toBeLessThanOrEqual(year.p50 + 1e-6);
        expect(year.p50, context).toBeLessThanOrEqual(year.p90 + 1e-6);
      }
    }
    expect(calculated).toBeGreaterThan(30);
  }, 60_000);
});
