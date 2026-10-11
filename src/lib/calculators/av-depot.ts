/**
 * Altersvorsorgedepot-Rechner: vergleicht ein gefördertes AV-Depot mit einem
 * normalen ETF-Depot über Anspar- und Auszahlungsphase.
 *
 * Eigene Umsetzung, die dem Finanzfluss-Rechner folgt
 * (https://www.finanzfluss.de/rechner/altersvorsorgedepot/). Das Original liegt
 * als Submodul unter vendor/finanzfluss-calculators;
 * test/upstream/av-depot.parity.test.ts vergleicht beide. Ablauf für Updates:
 * README, Abschnitt "Abgleich mit dem Finanzfluss-Original".
 */
import type { TaxSavingsMode } from "@/lib/settings/schema";
import { incomeTax, marginalTax } from "./income-tax";

export const ABGELTUNGSTEUERSATZ = 0.26375;
export const TEILFREISTELLUNG = 0.7;
export const BASISERTRAG_FACTOR = 0.7;
export const AV_SUBSIDIZED_CAP = 1_800;
export const AV_CONTRIBUTION_CAP = 13_680; // 2 Verträge × 6.840 €
export const KINDERZULAGE_CAP = 300;
export const MIN_OWN_CONTRIBUTION = 120;
export const BERUFSEINSTEIGER_BONUS = 200;
export const AV_DEPOT_START_YEAR = 2027;

export interface AvDepotInput {
  age: number;
  retirementAge: number;
  /** Zu versteuerndes Einkommen pro Jahr in der Ansparphase / im Ruhestand. */
  zveSavingsPhase: number;
  zveRetirement: number;
  /** Eigene Einzahlung pro Jahr in €. */
  savingsRate: number;
  /** Erwartete ETF-Rendite nach Fondskosten, in Prozent. */
  etfReturnRate: number;
  /** Zusätzliche Kosten des AV-Depots pro Jahr, in Prozent. */
  avDepotCosts: number;
  /** Sparerpauschbetrag für die Vergleichsrechnung in €. */
  exemptionOrder: number;
  taxSavingsMode: TaxSavingsMode;
  /** Basiszins für die Vorabpauschale, in Prozent. */
  baseRate: number;
  /** Einmalauszahlung bei Renteneintritt, in Prozent des Kapitals. */
  oneTimePayout: number;
  /** Rendite in der Auszahlungsphase, in Prozent. */
  payoutReturnRate: number;
  payoutUntilAge: number;
  childBirthYears: number[];
  /** Erstes Beitragsjahr; Standard ist max(2027, aktuelles Jahr). */
  currentYear?: number;
}

export interface AvDepotYear {
  /** Alter am Ende des Beitragsjahres. */
  age: number;
  calendarYear: number;
  av: {
    ownContribution: number;
    grundzulage: number;
    kinderzulage: number;
    starterBonus: number;
    taxSaving: number;
    /** Kapital im AV-Depot plus ggf. Nebendepot am Jahresende. */
    capitalEnd: number;
    cumulativeOwnContributions: number;
    /** Zulagen plus investierte Steuerersparnis, kumuliert. */
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
  /** Erstes Jahr inklusive Einmalauszahlung. */
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
    /** Teil der Steuerersparnis, der investiert statt konsumiert wurde. */
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

/** Prüft die Eingaben; eine leere Liste bedeutet, dass gerechnet werden kann. */
export function validateAvDepotInput(input: AvDepotInput): string[] {
  const errors: string[] = [];
  if (input.age < 18 || input.age > 67) {
    errors.push("Das Alter muss zwischen 18 und 67 Jahren liegen.");
  }
  if (input.retirementAge < 65 || input.retirementAge > 70) {
    errors.push("Der Renteneintritt muss zwischen 65 und 70 Jahren liegen.");
  }
  if (input.age >= input.retirementAge) {
    errors.push("Das Alter muss unter dem Renteneintrittsalter liegen.");
  }
  if (input.payoutUntilAge <= input.retirementAge) {
    errors.push("Die Auszahlung muss nach dem Renteneintritt enden.");
  }
  if (
    input.savingsRate < MIN_OWN_CONTRIBUTION ||
    input.savingsRate > AV_CONTRIBUTION_CAP
  ) {
    errors.push(
      "Die Sparrate muss zwischen 120 € und 13.680 € pro Jahr liegen (10 € bis 1.140 € pro Monat).",
    );
  }
  if (input.etfReturnRate <= 0 || input.payoutReturnRate <= 0) {
    errors.push("Die Renditen müssen größer als 0 % sein.");
  }
  if (
    input.avDepotCosts >= input.etfReturnRate ||
    input.avDepotCosts >= input.payoutReturnRate
  ) {
    errors.push("Die Kosten des AV-Depots müssen unter den Renditen liegen.");
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

  // --- Ansparphase: normales Depot -------------------------------------
  const normal = simulateTaxedDepot(
    Array.from({ length: savingYears }, () => input.savingsRate),
    returnRate,
    baseRate,
    input.exemptionOrder,
    input.zveSavingsPhase,
  );

  // --- Ansparphase: AV-Depot -------------------------------------------
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
      incomeTax(input.zveSavingsPhase) -
        incomeTax(Math.max(0, input.zveSavingsPhase - deduction)) -
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

  // --- Ansparphase: Nebendepot für die Steuerersparnis -------------------
  const secondary = secondaryContributions.some((c) => c > 0)
    ? simulateTaxedDepot(
        secondaryContributions,
        returnRate,
        baseRate,
        input.exemptionOrder,
        input.zveSavingsPhase,
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

  // --- Auszahlungsphase ---------------------------------------------------
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
      gross * normalGainFraction * TEILFREISTELLUNG - input.exemptionOrder,
    );
    const tax = cheaperTax(taxable, input.zveRetirement);
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

  // Die Quellen werden nacheinander auf das Ruhestandseinkommen aufgeschlagen:
  // geförderte Entnahme, ungeförderter Gewinnanteil, Kapitalerträge Nebendepot.
  const avPayoutYear = (avGross: number, secondaryGross: number): PayoutYear => {
    const subsidized = avGross * subsidizedFraction;
    const subsidizedTax = marginalTax(subsidized, input.zveRetirement);

    const unsubsidizedTaxable =
      avGross *
      (1 - subsidizedFraction) *
      unsubsidizedGainFraction *
      (halfIncomeApplies ? 0.5 : 1);
    const unsubsidizedTax = marginalTax(
      unsubsidizedTaxable,
      input.zveRetirement + subsidized,
    );

    const secondaryTaxable = Math.max(
      0,
      secondaryGross * secondaryGainFraction * TEILFREISTELLUNG -
        input.exemptionOrder,
    );
    const secondaryTax = cheaperTax(
      secondaryTaxable,
      input.zveRetirement + subsidized + unsubsidizedTaxable,
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

/** Normal besteuertes Depot: Einzahlung am Jahresende, Steuer auf die Vorabpauschale. */
function simulateTaxedDepot(
  contributions: number[],
  returnRate: number,
  baseRate: number,
  exemptionOrder: number,
  zve: number,
): DepotSavings {
  const years: DepotSavings["years"] = [];
  let capital = 0;
  let totalVorabpauschale = 0;

  for (const contribution of contributions) {
    const grossReturn = capital * returnRate;
    const vorabpauschale = Math.min(
      capital * baseRate * BASISERTRAG_FACTOR,
      grossReturn,
    );
    const vorabpauschaleTax = cheaperTax(
      Math.max(0, vorabpauschale * TEILFREISTELLUNG - exemptionOrder),
      zve,
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
    savingsYear === 1 && age < 25 ? BERUFSEINSTEIGER_BONUS : 0;
  const calendarYear = startYear + savingsYear - 1;
  const eligibleChildren = childBirthYears.filter((birthYear) => {
    const childAge = calendarYear - birthYear;
    return childAge >= 0 && childAge < 18;
  }).length;
  const kinderzulage =
    eligibleChildren * Math.min(contribution, KINDERZULAGE_CAP);

  return { grundzulage, kinderzulage, starterBonus };
}

/** Günstigerprüfung: Abgeltungsteuer oder persönlicher Steuersatz, je nachdem was niedriger ist. */
function cheaperTax(taxableGain: number, zve: number): number {
  return Math.min(
    taxableGain * ABGELTUNGSTEUERSATZ,
    marginalTax(taxableGain, zve),
  );
}

function gainFraction(capital: number, costBasis: number): number {
  return capital > 0 ? Math.max(0, capital - costBasis) / capital : 0;
}

/** Konstante vorschüssige Entnahme, die `capital` in `years` Jahren aufbraucht. */
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
