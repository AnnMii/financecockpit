import type { Metadata } from "next";
import { AvDepotCalculator } from "@/components/av-depot/av-depot-calculator";

export const metadata: Metadata = { title: "Altersvorsorgedepot-Rechner" };

export default function AvDepotPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Altersvorsorgedepot-Rechner</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        Vergleicht das staatlich geförderte Altersvorsorgedepot mit einem
        normalen ETF-Sparplan bei gleichen Einzahlungen. Änderungen werden
        automatisch in deinem Konto gespeichert.
      </p>
      <AvDepotCalculator />
    </>
  );
}
