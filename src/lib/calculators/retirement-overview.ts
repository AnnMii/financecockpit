import {
  type GapClosing,
  type PensionGapInput,
  calculatePensionGap,
} from "./pension-gap";

/**
 * Combines two calculators into one picture of retirement: the pensions from
 * the Rentenlücke calculator plus the net pension the Altersvorsorgedepot
 * pays, measured against the desired pension.
 */
export interface RetirementOverview {
  desiredPension: number;
  /** Net pension from the entitlements entered in the Rentenlücke calculator. */
  netPension: number;
  /** Monthly net payout of the Altersvorsorgedepot counted towards the gap. */
  avDepotPension: number;
  /** What is still missing per month after both. */
  remainingGap: number;
  /** Capital and monthly savings rate that close the remaining gap, using the capital up. */
  closing: GapClosing;
}

export function calculateRetirementOverview(
  pensionGapInput: PensionGapInput,
  avDepotMonthlyNet: number,
): RetirementOverview {
  const { netPension, gap } = calculatePensionGap(pensionGapInput);
  const avDepotPension = Math.min(gap, Math.max(0, avDepotMonthlyNet));

  // The AV-Depot pension lowers what the remaining savings have to pay.
  const remaining = calculatePensionGap({
    ...pensionGapInput,
    desiredPension: pensionGapInput.desiredPension - avDepotPension,
  });

  return {
    desiredPension: pensionGapInput.desiredPension,
    netPension,
    avDepotPension,
    remainingGap: remaining.gap,
    closing: remaining.withConsumption,
  };
}
