import type { AllSettings } from "@/lib/settings/schema";
import type { AvDepotInput } from "./av-depot";

export interface CalculatorInfo {
  id: string;
  href: string;
  title: string;
  description: string;
}

/** Every calculator of the cockpit; drives the navigation and the start page. */
export const calculators: CalculatorInfo[] = [
  {
    id: "av-depot",
    href: "/rechner/altersvorsorgedepot",
    title: "Altersvorsorgedepot",
    description:
      "Gefördertes AV-Depot gegen einen normalen ETF-Sparplan: Endvermögen, Förderung und Netto-Rente.",
  },
];

export function toAvDepotInput(settings: AllSettings): AvDepotInput {
  const { shared } = settings;
  return {
    age: shared.age,
    retirementAge: shared.retirementAge,
    zveSavingsPhase: shared.zveSavingsPhase,
    zveRetirement: shared.zveRetirement,
    savingsRate: shared.savingsRateMonthly * 12,
    etfReturnRate: shared.expectedReturn,
    exemptionOrder: shared.exemptionOrder,
    childBirthYears: shared.childBirthYears,
    ...settings["av-depot"],
  };
}
