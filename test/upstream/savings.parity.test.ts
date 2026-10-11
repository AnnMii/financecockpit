import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { parseGerman } from "@/lib/calculators/fixtures";
import { type SavingsInput, calculateSavings } from "@/lib/calculators/savings";

/**
 * Runs our Sparrechner against the original from the pinned submodule
 * vendor/finanzfluss-calculators. See "Abgleich mit dem Finanzfluss-Original"
 * in the README.
 */

const upstreamFile = fileURLToPath(
  new URL(
    "../../vendor/finanzfluss-calculators/src/calculators/savings.ts",
    import.meta.url,
  ),
);
const upstreamAvailable = existsSync(upstreamFile);

interface UpstreamResult {
  endValue: string;
  startCapital: string;
  savingRate: string;
  yearlyDuration: string;
  yearlyInterest: string;
  deposits: string;
  interestAfterTax: string;
}

let upstream: { validateAndCalculate: (input: unknown) => UpstreamResult };

const UPSTREAM_OUTPUT = {
  endValue: "endValue",
  startValue: "startValue",
  yearlyInterest: "yearlyInterest",
  duration: "monthlyDuration",
  savingRate: "savingRate",
} as const;

function original(input: SavingsInput): UpstreamResult {
  return upstream.validateAndCalculate({
    output: UPSTREAM_OUTPUT[input.output],
    startValue: input.startValue,
    savingRate: input.savingRate,
    saveIntervalType: input.saveInterval,
    savingType: "inAdvance",
    yearlyInterest: input.yearlyInterest,
    interestIntervalType: input.interestInterval,
    yearlyDuration: input.durationYears,
    endValue: input.endValue,
    considerCapitalGainsTax: input.considerTax,
    capitalGainsTax: input.capitalGainsTax,
    distributionType: input.distributionType,
    partialExemption: input.partialExemption,
    useCompoundInterest: true,
  });
}

function sampleInput(overrides: Partial<SavingsInput> = {}): SavingsInput {
  return {
    output: "endValue",
    startValue: 5_000,
    savingRate: 150,
    saveInterval: "monthly",
    yearlyInterest: 1.5,
    interestInterval: "monthly",
    durationYears: 7,
    endValue: 20_000,
    considerTax: false,
    capitalGainsTax: 26.375,
    distributionType: "distributing",
    partialExemption: 0,
    ...overrides,
  };
}

/** Compares one input; returns false when the original itself gives up on it. */
function expectParity(input: SavingsInput): boolean {
  const { result, errors } = calculateSavings(input);
  let theirs: UpstreamResult;
  try {
    theirs = original(input);
  } catch {
    // Its interest-rate search does not converge for every input.
    return false;
  }
  const context = `input ${JSON.stringify(input)}`;
  expect(errors, context).toEqual([]);

  // The original rounds money to cents, and duration and interest to two digits.
  const close = (what: string, actual: number, expected: string, tolerance: number) =>
    expect(
      Math.abs(actual - parseGerman(expected.replace("%", ""))),
      `${what}: ours ${actual}, original ${expected}, ${context}`,
    ).toBeLessThanOrEqual(tolerance);

  close("end value", result!.endValue, theirs.endValue, 0.02);
  close("start value", result!.startValue, theirs.startCapital, 0.02);
  close("saving rate", result!.savingRate, theirs.savingRate, 0.02);
  close("duration", result!.durationYears, theirs.yearlyDuration, 0.006);
  close("interest rate", result!.yearlyInterest, theirs.yearlyInterest, 0.006);
  // When the duration is searched, the original stops within 0.0001 € of the
  // target, which leaves its duration a few minutes off; the deposits made in
  // that time are allowed as difference.
  const depositsPerYear =
    input.savingRate * (input.saveInterval === "monthly" ? 12 : 1);
  const slack = input.output === "duration" ? depositsPerYear * 0.0001 : 0;
  close("deposits", result!.deposits, theirs.deposits, 0.05 + slack);
  close("interest", result!.interest, theirs.interestAfterTax, 0.07 + slack);
  return true;
}

const OUTPUTS = ["startValue", "yearlyInterest", "duration", "savingRate"] as const;

/** The plan as the end-value calculation, plus the four questions leading back to it. */
function allOutputs(plan: SavingsInput): SavingsInput[] {
  const endValue = calculateSavings({ ...plan, output: "endValue" }).result!.endValue;
  return [
    { ...plan, output: "endValue" },
    ...OUTPUTS.map((output) => ({ ...plan, output, endValue })),
  ];
}

describe.skipIf(!upstreamAvailable)("Sparrechner parity with the original", () => {
  beforeAll(async () => {
    const mod = await import(/* @vite-ignore */ pathToFileURL(upstreamFile).href);
    upstream = mod.savings;
  });

  it.each([
    ["Standardwerte der Finanzfluss-Seite", sampleInput()],
    ["jährlich sparen, monatliche Zinsen", sampleInput({ saveInterval: "yearly", savingRate: 1_800 })],
    ["jährlich sparen, vierteljährliche Zinsen", sampleInput({ saveInterval: "yearly", savingRate: 1_800, interestInterval: "quarterly" })],
    ["jährlich sparen, jährliche Zinsen", sampleInput({ saveInterval: "yearly", savingRate: 1_800, interestInterval: "yearly" })],
    ["monatlich sparen, vierteljährliche Zinsen", sampleInput({ interestInterval: "quarterly", yearlyInterest: 4 })],
    ["monatlich sparen, jährliche Zinsen", sampleInput({ interestInterval: "yearly", yearlyInterest: 4 })],
    ["ausschüttend mit Steuer", sampleInput({ considerTax: true, yearlyInterest: 6, durationYears: 20 })],
    ["thesaurierend mit Steuer", sampleInput({ considerTax: true, distributionType: "accumulating", yearlyInterest: 6, durationYears: 20 })],
    ["thesaurierend mit Teilfreistellung", sampleInput({ considerTax: true, distributionType: "accumulating", partialExemption: 30, yearlyInterest: 7, durationYears: 30 })],
    ["ohne Sparrate", sampleInput({ savingRate: 0, yearlyInterest: 5, startValue: 10_000 })],
    ["ohne Anfangskapital", sampleInput({ startValue: 0, yearlyInterest: 5 })],
  ])("matches the original for every question: %s", (_name, plan) => {
    for (const input of allOutputs(plan)) expect(expectParity(input)).toBe(true);
  });

  it("matches the original across random inputs", () => {
    // Fixed seed, so a failing input can be reproduced.
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const between = (min: number, max: number) => min + random() * (max - min);
    const pick = <T,>(options: readonly T[]) => options[Math.floor(random() * options.length)];

    let compared = 0;
    let originalGaveUp = 0;
    for (let i = 0; i < 60; i++) {
      const saveInterval = pick(["monthly", "yearly"] as const);
      const plan = sampleInput({
        startValue: Math.round(between(0, 50_000)),
        savingRate: Math.round(between(25, saveInterval === "monthly" ? 1_500 : 15_000)),
        saveInterval,
        yearlyInterest: Math.round(between(0.5, 9) * 100) / 100,
        interestInterval: pick(["monthly", "quarterly", "yearly"] as const),
        durationYears: Math.round(between(2, 40)),
        considerTax: i % 2 === 0,
        distributionType: pick(["distributing", "accumulating"] as const),
        partialExemption: pick([0, 15, 30]),
      });
      for (const input of allOutputs(plan)) {
        if (expectParity(input)) compared++;
        else originalGaveUp++;
      }
    }
    expect(compared).toBeGreaterThan(280);
    expect(originalGaveUp).toBeLessThan(20);
  }, 60_000);
});

describe.skipIf(upstreamAvailable)("Sparrechner parity with the original", () => {
  it("is skipped: run `git submodule update --init` to enable it", () => {
    expect(upstreamAvailable).toBe(false);
  });
});
