import type { Metadata } from "next";
import { WithdrawalPlanCalculator } from "@/components/withdrawal-plan/withdrawal-plan-calculator";

export const metadata: Metadata = { title: "Entnahmeplan" };

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Entnahmeplan</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        Berechnet, wie viel du regelmäßig aus einem Vermögen entnehmen kannst, wie
        lange es reicht oder wie groß es sein muss. Änderungen gelten nur
        hier, bis du sie im Profil speicherst.
      </p>
      <WithdrawalPlanCalculator />
    </>
  );
}
