import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  type AvDepotInput,
  calculateAvDepot,
} from "@/lib/calculators/av-depot";

/**
 * Runs our AV-Depot calculation against the original from the pinned
 * submodule vendor/finanzfluss-calculators. After moving the submodule to a
 * newer commit, a failure here shows where our implementation has to follow.
 * See "Syncing with the Finanzfluss original" in the README.
 */

const upstreamFile = fileURLToPath(
  new URL(
    "../../vendor/finanzfluss-calculators/src/calculators/av-depot.ts",
    import.meta.url,
  ),
);
const upstreamAvailable = existsSync(upstreamFile);

interface DepotPair {
  avDepot: string;
  normalDepot: string;
}
type PayoutPairs = Record<"gross" | "tax" | "net", DepotPair>;
interface UpstreamResult {
  savingsPerYear: { capitalEnd: DepotPair }[];
  finalCapital: DepotPair;
  totalContributions: DepotPair;
  firstPayoutYear: PayoutPairs;
  regularPayoutYear: PayoutPairs;
  payoutTotal: PayoutPairs;
}

// The original takes roughly 60 ms per calculation.
const RANDOM_CASES = 60;

let upstream: { validateAndCalculate: (input: unknown) => UpstreamResult };

// The original returns formatted text such as "617.285€" or "512,25€".
function parse(value: string): number {
  return Number(value.replace("€", "").replaceAll(".", "").replace(",", "."));
}

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

function expectParity(input: AvDepotInput) {
  const ours = calculateAvDepot(input);
  // The original still uses the German abbreviation "zve" for taxable income.
  const { taxableIncomeSavingsPhase, taxableIncomeRetirement, ...rest } = input;
  const theirs = upstream.validateAndCalculate({
    ...rest,
    zveSavingsPhase: taxableIncomeSavingsPhase,
    zveRetirement: taxableIncomeRetirement,
  });
  // The original rounds to whole euros (to cents below 1.000 €).
  const close = (what: string, actual: number, expected: string) =>
    expect(
      Math.abs(actual - parse(expected)),
      `${what}: ours ${actual.toFixed(2)}, original ${expected}, input ${JSON.stringify(input)}`,
    ).toBeLessThanOrEqual(0.51);

  close("final capital AV", ours.av.finalCapital, theirs.finalCapital.avDepot);
  close("final capital normal", ours.normal.finalCapital, theirs.finalCapital.normalDepot);
  close("contributions", ours.av.ownContributions, theirs.totalContributions.avDepot);

  const payouts = [
    ["first year", "firstYear", theirs.firstPayoutYear],
    ["regular year", "regularYear", theirs.regularPayoutYear],
    ["total", "total", theirs.payoutTotal],
  ] as const;
  for (const [name, key, expected] of payouts) {
    for (const part of ["gross", "tax", "net"] as const) {
      close(`AV payout ${name} ${part}`, ours.av.payout[key][part], expected[part].avDepot);
      close(`normal payout ${name} ${part}`, ours.normal.payout[key][part], expected[part].normalDepot);
    }
  }

  expect(ours.years).toHaveLength(theirs.savingsPerYear.length);
  ours.years.forEach((year, i) => {
    const expected = theirs.savingsPerYear[i].capitalEnd;
    close(`year ${i + 1} AV capital`, year.av.capitalEnd, expected.avDepot);
    close(`year ${i + 1} normal capital`, year.normal.capitalEnd, expected.normalDepot);
  });
}

describe.skipIf(!upstreamAvailable)("AV-Depot parity with the original", () => {
  beforeAll(async () => {
    const mod = await import(/* @vite-ignore */ pathToFileURL(upstreamFile).href);
    upstream = mod.avDepot;
  });

  it.each([
    ["tax savings into the side depot", sampleInput()],
    ["tax savings into the AV-Depot", sampleInput({ taxSavingsMode: "avDepot" })],
    ["tax savings spent", sampleInput({ taxSavingsMode: "consume" })],
    ["children", sampleInput({ childBirthYears: [2026, 2019] })],
    ["career starter", sampleInput({ age: 22, savingsRate: 1_800 })],
    ["minimum contribution", sampleInput({ savingsRate: 120, taxableIncomeSavingsPhase: 15_000 })],
    ["maximum contribution", sampleInput({ savingsRate: 13_680, taxSavingsMode: "avDepot" })],
    ["short saving phase", sampleInput({ age: 60, retirementAge: 65, oneTimePayout: 0 })],
    ["high income", sampleInput({ taxableIncomeSavingsPhase: 300_000, taxableIncomeRetirement: 90_000 })],
    ["no income in retirement", sampleInput({ taxableIncomeRetirement: 0, baseRate: 0 })],
  ])("matches the original: %s", (_name, input) => {
    expectParity(input);
  });

  it("matches the original across random inputs", () => {
    // Fixed seed, so a failing input can be reproduced.
    let seed = 42;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const between = (min: number, max: number) => min + random() * (max - min);
    const modes = ["avDepot", "secondaryDepot", "consume"] as const;

    for (let i = 0; i < RANDOM_CASES; i++) {
      expectParity({
        currentYear: 2027,
        age: Math.round(between(18, 64)),
        retirementAge: Math.round(between(65, 70)),
        taxableIncomeSavingsPhase: Math.round(between(0, 150_000)),
        taxableIncomeRetirement: Math.round(between(0, 60_000)),
        savingsRate: Math.round(between(120, 13_680)),
        etfReturnRate: Math.round(between(2, 10) * 10) / 10,
        avDepotCosts: Math.round(between(0, 1) * 100) / 100,
        exemptionOrder: Math.round(between(0, 1_000)),
        taxSavingsMode: modes[i % 3],
        baseRate: Math.round(between(0, 4) * 10) / 10,
        oneTimePayout: Math.round(between(0, 30)),
        payoutReturnRate: Math.round(between(1.5, 6) * 10) / 10,
        payoutUntilAge: Math.round(between(85, 100)),
        childBirthYears: i % 4 === 0 ? [2015, 2024] : [],
      });
    }
  }, 60_000);
});

describe.skipIf(upstreamAvailable)("AV-Depot parity with the original", () => {
  it("is skipped: run `git submodule update --init` to enable it", () => {
    expect(upstreamAvailable).toBe(false);
  });
});
