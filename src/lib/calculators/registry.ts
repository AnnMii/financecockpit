import type { AllSettings, SettingsScope } from "@/lib/settings/schema";
import type { AvDepotInput } from "./av-depot";

export interface CalculatorInfo {
  /** Also the settings scope of the calculator. */
  id: Exclude<SettingsScope, "shared">;
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
    payoutReturnRate: shared.retirementReturn,
    payoutUntilAge: shared.payoutUntilAge,
    ...settings["av-depot"],
  };
}
