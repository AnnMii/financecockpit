"use client";

import Link from "next/link";
import { useAvDepot } from "@/components/av-depot/use-av-depot";
import { Card } from "@/components/fields";
import { useSettings } from "@/components/settings-provider";
import { StatTile } from "@/components/stat-tile";
import { calculators } from "@/lib/calculators/registry";
import { formatEuro, formatNumber } from "@/lib/format";

export function Dashboard() {
  const { settings } = useSettings();
  const { shared } = settings;
  const { input, result } = useAvDepot();
  const value = (amount: number | undefined) =>
    amount === undefined ? "–" : formatEuro(amount);

  const keyData = [
    ["Alter", `${shared.age} Jahre`],
    ["Renteneintritt", `mit ${shared.retirementAge}`],
    ["Sparrate", `${formatEuro(shared.savingsRateMonthly)} / Monat`],
    ["Rendite MSCI World", `${formatNumber(shared.expectedReturn)} % p. a.`],
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="mb-3 text-base font-semibold">
          Kennzahlen
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <StatTile
            label={`Altersvorsorgedepot mit ${input.retirementAge}`}
            value={value(result?.av.finalCapital)}
            note="Endvermögen vor Steuern"
          />
          <StatTile
            label="Netto-Rente pro Monat"
            value={value(result?.av.payout.monthlyNet)}
            note={`Aus dem Altersvorsorgedepot, bis Alter ${input.payoutUntilAge}`}
          />
          <StatTile
            label="Förderung gesamt"
            value={value(
              result ? result.av.allowances + result.av.taxSavings : undefined,
            )}
            note="Zulagen und Steuerersparnis"
          />
        </div>
        {!result && (
          <p className="mt-3 text-sm text-ink-2">
            Mit den aktuellen Einstellungen lässt sich das Altersvorsorgedepot
            nicht berechnen –{" "}
            <Link href="/rechner/altersvorsorgedepot" className="font-medium text-accent">
              im Rechner prüfen
            </Link>
            .
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Deine Eckdaten</h2>
            <Link href="/einstellungen" className="text-sm font-medium text-accent">
              Ändern
            </Link>
          </div>
          <dl className="divide-y divide-line text-sm">
            {keyData.map(([label, text]) => (
              <div key={label} className="flex justify-between py-2">
                <dt className="text-ink-2">{label}</dt>
                <dd className="font-medium tabular-nums">{text}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-base font-semibold">Rechner</h2>
          <ul className="space-y-3">
            {calculators.map((calculator) => (
              <li key={calculator.id}>
                <Link
                  href={calculator.href}
                  className="block rounded-lg border border-line p-4 hover:bg-accent-wash"
                >
                  <span className="font-medium text-accent">
                    {calculator.title}
                  </span>
                  <span className="mt-1 block text-sm text-ink-2">
                    {calculator.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
