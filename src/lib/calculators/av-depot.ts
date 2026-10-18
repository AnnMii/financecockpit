/**
 * Altersvorsorgedepot calculator: compares a subsidised AV-Depot with a
 * normal ETF depot over the saving and payout phases.
 *
 * Own implementation that follows the Finanzfluss calculator
 * (https://www.finanzfluss.de/rechner/altersvorsorgedepot/). The original is
 * a submodule under vendor/finanzfluss-calculators;
 * test/upstream/av-depot.parity.test.ts compares the two. Procedure for updates:
 * README, section "Syncing with the Finanzfluss original".
 */
import type { TaxSavingsMode } from "@/lib/settings/schema";
import type { CalculationError } from "./errors";
import { incomeTax, marginalTax } from "./income-tax";

export const FLAT_TAX_RATE = 0.26375;
export const TAXABLE_SHARE_OF_EQUITY_FUND_GAINS = 0.7;
export const BASE_YIELD_FACTOR = 0.7;
export const AV_SUBSIDIZED_CAP = 1_800;
/**
 * Legal cap on the effective costs of the standard depot, in percent per year
 * (Altersvorsorgereformgesetz of 2026; earlier drafts had 1,5 %). It does not
 * apply to a freely composed depot.
 */
export const AV_COSTS_CAP_PERCENT = 1;
export const AV_CONTRIBUTION_CAP = 13_680; // 2 contracts × 6,840 €
export const CHILD_ALLOWANCE_CAP = 300;
export const MIN_OWN_CONTRIBUTION = 120;
export const CAREER_STARTER_BONUS = 200;
export const AV_DEPOT_START_YEAR = 2027;

export interface AvDepotInput {
  age: number;
  retirementAge: number;
  /** Taxable income per year in the saving phase / in retirement. */
  taxableIncomeSavingsPhase: number;
  taxableIncomeRetirement: number;
  /** Own contribution per year in €. */
  savingsRate: number;
  /** Expected ETF return before costs, in percent. */
  etfReturnRate: number;
  /** Costs of the AV-Depot per year (fund costs and fees together), in percent. */
  avDepotCosts: number;
  /** Tax-free allowance for the comparison calculation, in €. */
  exemptionOrder: number;
  taxSavingsMode: TaxSavingsMode;
  /** Base rate for the advance lump sum (Vorabpauschale), in percent. */
  baseRate: number;
  /** One-time payout at retirement, in percent of the capital. */
  oneTimePayout: number;
  /** Return in the payout phase, in percent. */
  payoutReturnRate: number;
  payoutUntilAge: number;
  childBirthYears: number[];
  /** First contribution year; the default is max(2027, current year). */
  currentYear?: number;
}

export interface AvDepotYear {
  /** Age at the end of the contribution year. */
  age: number;
  calendarYear: number;
  av: {
    ownContribution: number;
    grundzulage: number;
    kinderzulage: number;
    starterBonus: number;
    taxSaving: number;
    /** Capital in the AV-Depot plus the side depot, if any, at the end of the year. */
    capitalEnd: number;
    cumulativeOwnContributions: number;
    /** Allowances plus invested tax savings, cumulative. */
    cumulativeSubsidies: number;
    cumulativeGains: number;
  };
  normal: {
    contribution: number;
    vorabpauschaleTax: number;
    capitalEnd: number;
  };
}

export interface PayoutYear {
  gross: number;
  tax: number;
  net: number;
}

export interface PayoutResult {
  /** First year including the one-time payout. */
  firstYear: PayoutYear;
  regularYear: PayoutYear;
  total: PayoutYear;
  monthlyNet: number;
}

export interface AvDepotResult {
  savingYears: number;
  payoutYears: number;
  years: AvDepotYear[];
  av: {
    finalCapital: number;
    subsidizedCapital: number;
    unsubsidizedCapital: number;
    secondaryDepotCapital: number;
    ownContributions: number;
    allowances: number;
    taxSavings: number;
    /** Part of the tax savings that was invested instead of spent. */
    investedTaxSavings: number;
    gains: number;
    payout: PayoutResult;
  };
  normal: {
    finalCapital: number;
    contributions: number;
    gains: number;
    payout: PayoutResult;
  };
}

interface DepotSavings {
  years: { contribution: number; vorabpauschaleTax: number; capitalEnd: number }[];
  finalCapital: number;
  totalContributions: number;
  totalVorabpauschale: number;
}

/** Checks the inputs; an empty list means the calculation can run. */
export function validateAvDepotInput(input: AvDepotInput): CalculationError[] {
  const errors: CalculationError[] = [];
  if (input.age < 18 || input.age > 67) {
    errors.push("avAgeRange");
  }
  if (input.retirementAge < 65 || input.retirementAge > 70) {
    errors.push("avRetirementRange");
  }
  if (input.age >= input.retirementAge) {
    errors.push("ageBeforeRetirement");
  }
  if (input.payoutUntilAge < 85) {
    errors.push("avPayoutMin85");
  }
  if (input.payoutUntilAge <= input.retirementAge) {
    errors.push("payoutAfterRetirement");
  }
  if (
    input.savingsRate < MIN_OWN_CONTRIBUTION ||
    input.savingsRate > AV_CONTRIBUTION_CAP
  ) {
    errors.push("avSavingsRateRange");
  }
  if (input.etfReturnRate <= 0 || input.payoutReturnRate <= 0) {
    errors.push("avReturnsPositive");
  }
  if (
    input.avDepotCosts >= input.etfReturnRate ||
    input.avDepotCosts >= input.payoutReturnRate
  ) {
    errors.push("avCostsBelowReturns");
  }
  return errors;
}

export function calculateAvDepot(input: AvDepotInput): AvDepotResult {
  const returnRate = input.etfReturnRate / 100;
  const avCosts = input.avDepotCosts / 100;
  const baseRate = input.baseRate / 100;
  const lumpSumShare = input.oneTimePayout / 100;
  const payoutRate = input.payoutReturnRate / 100;
  const startYear =
    input.currentYear ??
    Math.max(AV_DEPOT_START_YEAR, new Date().getFullYear());

  const savingYears = input.retirementAge - input.age;
  const payoutYears = input.payoutUntilAge - input.retirementAge;

  // --- Saving phase: normal depot --------------------------------------
  const normal = simulateTaxedDepot(
    Array.from({ length: savingYears }, () => input.savingsRate),
    returnRate,
    baseRate,
    input.exemptionOrder,
    input.taxableIncomeSavingsPhase,
  );

  // --- Saving phase: AV-Depot ------------------------------------------
  const avReturnRate = returnRate - avCosts;
  let subsidizedCapital = 0;
  let unsubsidizedCapital = 0;
  let unsubsidizedContributions = 0;
  let allowances = 0;
  let taxSavings = 0;
  let investedTaxSavings = 0;
  const secondaryContributions: number[] = [];
  const avYears: (AvDepotYear["av"] & { avCapitalEnd: number })[] = [];

  for (let t = 1; t <= savingYears; t++) {
    const contribution = input.savingsRate;
    const { grundzulage, kinderzulage, starterBonus } = calculateAllowances(
      contribution,
      t,
      startYear,
      input.age,
      input.childBirthYears,
    );

    const deduction =
      Math.min(contribution, AV_SUBSIDIZED_CAP) + grundzulage + kinderzulage;
    const taxSaving = Math.max(
      0,
      incomeTax(input.taxableIncomeSavingsPhase) -
        incomeTax(Math.max(0, input.taxableIncomeSavingsPhase - deduction)) -
        grundzulage -
        kinderzulage,
    );

    const reinvested =
      input.taxSavingsMode === "avDepot"
        ? Math.min(taxSaving, AV_CONTRIBUTION_CAP - contribution)
        : 0;
    const toSecondary =
      input.taxSavingsMode === "consume" ? 0 : taxSaving - reinvested;
    secondaryContributions.push(toSecondary);

    const yearAllowances = grundzulage + kinderzulage + starterBonus;
    const subsidizedInflow =
      Math.min(contribution + reinvested, AV_SUBSIDIZED_CAP) + yearAllowances;
    const unsubsidizedInflow =
      contribution + reinvested + yearAllowances - subsidizedInflow;

    subsidizedCapital = subsidizedCapital * (1 + avReturnRate) + subsidizedInflow;
    unsubsidizedCapital =
      unsubsidizedCapital * (1 + avReturnRate) + unsubsidizedInflow;
    unsubsidizedContributions += unsubsidizedInflow;
    allowances += yearAllowances;
    taxSavings += taxSaving;
    investedTaxSavings += reinvested + toSecondary;

    avYears.push({
      ownContribution: contribution,
      grundzulage,
      kinderzulage,
      starterBonus,
      taxSaving,
      avCapitalEnd: subsidizedCapital + unsubsidizedCapital,
      capitalEnd: 0,
      cumulativeOwnContributions: contribution * t,
      cumulativeSubsidies: allowances + investedTaxSavings,
      cumulativeGains: 0,
    });
  }

  // --- Saving phase: side depot for the tax savings ----------------------
  const secondary = secondaryContributions.some((c) => c > 0)
    ? simulateTaxedDepot(
        secondaryContributions,
        returnRate,
        baseRate,
        input.exemptionOrder,
        input.taxableIncomeSavingsPhase,
      )
    : undefined;

  const years: AvDepotYear[] = avYears.map(({ avCapitalEnd, ...av }, i) => {
    const capitalEnd = avCapitalEnd + (secondary?.years[i].capitalEnd ?? 0);
    return {
      age: input.age + i + 1,
      calendarYear: startYear + i,
      av: {
        ...av,
        capitalEnd,
        cumulativeGains:
          capitalEnd - av.cumulativeOwnContributions - av.cumulativeSubsidies,
      },
      normal: normal.years[i],
    };
  });

  // --- Payout phase -------------------------------------------------------
  const normalGainFraction = gainFraction(
    normal.finalCapital,
    normal.totalContributions + normal.totalVorabpauschale,
  );
  const normalAnnuity = annuityDue(
    normal.finalCapital * (1 - lumpSumShare),
    payoutRate,
    payoutYears,
  );
  const normalPayoutYear = (gross: number): PayoutYear => {
    const taxable = Math.max(
      0,
      gross * normalGainFraction * TAXABLE_SHARE_OF_EQUITY_FUND_GAINS - input.exemptionOrder,
    );
    const tax = cheaperTax(taxable, input.taxableIncomeRetirement);
    return { gross, tax, net: gross - tax };
  };

  const avCapital = subsidizedCapital + unsubsidizedCapital;
  const secondaryCapital = secondary?.finalCapital ?? 0;
  const avAnnuity = annuityDue(
    avCapital * (1 - lumpSumShare),
    payoutRate - avCosts,
    payoutYears,
  );
  const secondaryAnnuity = annuityDue(
    secondaryCapital * (1 - lumpSumShare),
    payoutRate,
    payoutYears,
  );
  const subsidizedFraction = avCapital > 0 ? subsidizedCapital / avCapital : 0;
  const unsubsidizedGainFraction = gainFraction(
    unsubsidizedCapital,
    unsubsidizedContributions,
  );
  const secondaryGainFraction = gainFraction(
    secondaryCapital,
    (secondary?.totalContributions ?? 0) + (secondary?.totalVorabpauschale ?? 0),
  );
  const halfIncomeApplies = input.retirementAge >= 62 && savingYears >= 12;

  // The sources are added to the retirement income one after the other:
  // subsidised withdrawal, unsubsidised share of gains, capital gains of the side depot.
  const avPayoutYear = (avGross: number, secondaryGross: number): PayoutYear => {
    const subsidized = avGross * subsidizedFraction;
    const subsidizedTax = marginalTax(subsidized, input.taxableIncomeRetirement);

    const unsubsidizedTaxable =
      avGross *
      (1 - subsidizedFraction) *
      unsubsidizedGainFraction *
      (halfIncomeApplies ? 0.5 : 1);
    const unsubsidizedTax = marginalTax(
      unsubsidizedTaxable,
      input.taxableIncomeRetirement + subsidized,
    );

    const secondaryTaxable = Math.max(
      0,
      secondaryGross * secondaryGainFraction * TAXABLE_SHARE_OF_EQUITY_FUND_GAINS -
        input.exemptionOrder,
    );
    const secondaryTax = cheaperTax(
      secondaryTaxable,
      input.taxableIncomeRetirement + subsidized + unsubsidizedTaxable,
    );

    const gross = avGross + secondaryGross;
    const tax = subsidizedTax + unsubsidizedTax + secondaryTax;
    return { gross, tax, net: gross - tax };
  };

  const avFinalCapital = avCapital + secondaryCapital;
  const ownContributions = input.savingsRate * savingYears;

  return {
    savingYears,
    payoutYears,
    years,
    av: {
      finalCapital: avFinalCapital,
      subsidizedCapital,
      unsubsidizedCapital,
      secondaryDepotCapital: secondaryCapital,
      ownContributions,
      allowances,
      taxSavings,
      investedTaxSavings,
      gains: avFinalCapital - ownContributions - allowances - investedTaxSavings,
      payout: payoutResult(
        avPayoutYear(
          avCapital * lumpSumShare + avAnnuity,
          secondaryCapital * lumpSumShare + secondaryAnnuity,
        ),
        avPayoutYear(avAnnuity, secondaryAnnuity),
        payoutYears,
      ),
    },
    normal: {
      finalCapital: normal.finalCapital,
      contributions: normal.totalContributions,
      gains: normal.finalCapital - normal.totalContributions,
      payout: payoutResult(
        normalPayoutYear(normal.finalCapital * lumpSumShare + normalAnnuity),
        normalPayoutYear(normalAnnuity),
        payoutYears,
      ),
    },
  };
}

/** Normally taxed depot: contribution at the end of the year, tax on the advance lump sum. */
function simulateTaxedDepot(
  contributions: number[],
  returnRate: number,
  baseRate: number,
  exemptionOrder: number,
  taxableIncome: number,
): DepotSavings {
  const years: DepotSavings["years"] = [];
  let capital = 0;
  let totalVorabpauschale = 0;

  for (const contribution of contributions) {
    const grossReturn = capital * returnRate;
    const vorabpauschale = Math.min(
      capital * baseRate * BASE_YIELD_FACTOR,
      grossReturn,
    );
    const vorabpauschaleTax = cheaperTax(
      Math.max(0, vorabpauschale * TAXABLE_SHARE_OF_EQUITY_FUND_GAINS - exemptionOrder),
      taxableIncome,
    );
    capital = capital + contribution + grossReturn - vorabpauschaleTax;
    totalVorabpauschale += vorabpauschale;
    years.push({ contribution, vorabpauschaleTax, capitalEnd: capital });
  }

  return {
    years,
    finalCapital: capital,
    totalContributions: contributions.reduce((sum, c) => sum + c, 0),
    totalVorabpauschale,
  };
}

function calculateAllowances(
  contribution: number,
  savingsYear: number,
  startYear: number,
  age: number,
  childBirthYears: number[],
) {
  if (contribution < MIN_OWN_CONTRIBUTION) {
    return { grundzulage: 0, kinderzulage: 0, starterBonus: 0 };
  }
  const grundzulage =
    Math.min(contribution, 360) * 0.5 +
    Math.max(0, Math.min(contribution, AV_SUBSIDIZED_CAP) - 360) * 0.25;
  const starterBonus =
    savingsYear === 1 && age < 25 ? CAREER_STARTER_BONUS : 0;
  const calendarYear = startYear + savingsYear - 1;
  const eligibleChildren = childBirthYears.filter((birthYear) => {
    const childAge = calendarYear - birthYear;
    return childAge >= 0 && childAge < 18;
  }).length;
  const kinderzulage =
    eligibleChildren * Math.min(contribution, CHILD_ALLOWANCE_CAP);

  return { grundzulage, kinderzulage, starterBonus };
}

/** Comparison of the two tax rules: flat tax or personal tax rate, whichever is lower. */
function cheaperTax(taxableGain: number, taxableIncome: number): number {
  return Math.min(
    taxableGain * FLAT_TAX_RATE,
    marginalTax(taxableGain, taxableIncome),
  );
}

function gainFraction(capital: number, costBasis: number): number {
  return capital > 0 ? Math.max(0, capital - costBasis) / capital : 0;
}

/** Constant withdrawal at the start of the period that uses up `capital` in `years` years. */
function annuityDue(capital: number, rate: number, years: number): number {
  if (capital <= 0) return 0;
  if (rate === 0) return capital / years;
  return (capital * rate) / (1 - (1 + rate) ** -years) / (1 + rate);
}

function payoutResult(
  firstYear: PayoutYear,
  regularYear: PayoutYear,
  payoutYears: number,
): PayoutResult {
  const total = (key: keyof PayoutYear) =>
    firstYear[key] + regularYear[key] * (payoutYears - 1);
  return {
    firstYear,
    regularYear,
    total: { gross: total("gross"), tax: total("tax"), net: total("net") },
    monthlyNet: regularYear.net / 12,
  };
}
