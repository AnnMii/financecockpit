import type { Metadata } from "next";
import { SavingsCalculator } from "@/components/savings/savings-calculator";

export const metadata: Metadata = { title: "Sparrechner" };

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Sparrechner</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        Berechnet aus Anfangskapital, Sparrate, Zinssatz, Laufzeit und Endkapital
        die jeweils fehlende Größe. Änderungen gelten nur
        hier, bis du sie im Profil speicherst.
      </p>
      <SavingsCalculator />
    </>
  );
}
