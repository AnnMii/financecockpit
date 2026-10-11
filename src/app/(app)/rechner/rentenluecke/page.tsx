import type { Metadata } from "next";
import { PensionGapCalculator } from "@/components/pension-gap/pension-gap-calculator";

export const metadata: Metadata = { title: "Rentenlückenrechner" };

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Rentenlückenrechner</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        Zeigt die Lücke zwischen deiner erwarteten Nettorente und deiner
        Wunschrente – und mit welchem Kapital und welcher Sparrate du sie schließt. Änderungen gelten nur
        hier, bis du sie im Profil speicherst.
      </p>
      <PensionGapCalculator />
    </>
  );
}
