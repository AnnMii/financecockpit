"use client";

import Link from "next/link";
import { useAvDepot } from "@/components/av-depot/use-av-depot";
import { ShareBar } from "@/components/charts/share-bar";
import { Card } from "@/components/fields";
import { ProfilePicker } from "@/components/profile-picker";
import { useSettings } from "@/components/settings-provider";
import {
  usePensionGap,
  useSavings,
  useWithdrawalPlan,
} from "@/components/use-calculators";
import { type CalculatorInfo, calculators } from "@/lib/calculators/registry";
import { calculateRetirementOverview } from "@/lib/calculators/retirement-overview";
import {
  formatEuro,
  formatEuroCents,
  formatPercent,
  formatYears,
} from "@/lib/format";
import { selectText } from "@/lib/settings/labels";

interface Figure {
  label: string;
  value: string;
}

const calculatorById = Object.fromEntries(
  calculators.map((calculator) => [calculator.id, calculator]),
) as Record<CalculatorInfo["id"], CalculatorInfo>;

/** One calculator's key figures, or why it cannot calculate. */
function CalculatorCard({
  id,
  figures,
  errors,
}: {
  id: CalculatorInfo["id"];
  figures: Figure[] | null;
  errors: string[];
}) {
  const calculator = calculatorById[id];
  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">{calculator.title}</h3>
        <Link href={calculator.href} className="shrink-0 text-sm font-medium text-accent">
          Zum Rechner
        </Link>
      </div>
      {figures ? (
        <dl className="divide-y divide-line text-sm">
          {figures.map((figure) => (
            <div key={figure.label} className="flex justify-between gap-4 py-2">
              <dt className="text-ink-2">{figure.label}</dt>
              <dd className="text-right font-semibold tabular-nums">{figure.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-ink-2">
          Mit den gewählten Profilen nicht berechenbar: {errors[0]}
        </p>
      )}
    </Card>
  );
}

export function Dashboard() {
  const { settings } = useSettings();
  const avDepot = useAvDepot();
  const pensionGap = usePensionGap();
  const savings = useSavings();
  const withdrawal = useWithdrawalPlan();

  const avMonthlyNet = avDepot.result?.av.payout.monthlyNet ?? 0;
  const overview = pensionGap.result
    ? calculateRetirementOverview(pensionGap.input, avMonthlyNet)
    : null;
  const savingsRate = settings.shared.savingsRateMonthly;

  const perInterval = {
    monthly: "pro Monat",
    quarterly: "pro Quartal",
    biannual: "pro Halbjahr",
    yearly: "pro Jahr",
  }[withdrawal.input.interval];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="mb-4 text-sm text-ink-2">
          Die Auswahl gilt auch in den Rechnern. Profile anlegen und ändern
          kannst du dort und in den Einstellungen.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ProfilePicker scope="shared" />
          {calculators.map((calculator) => (
            <ProfilePicker key={calculator.id} scope={calculator.id} />
          ))}
        </div>
      </Card>

      <section aria-labelledby="retirement-heading" className="space-y-5">
        <h2 id="retirement-heading" className="text-base font-semibold">
          Ruhestand im Gesamtbild
        </h2>
        {overview ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Card>
              <p className="text-sm text-ink-2">Verbleibende Rentenlücke pro Monat</p>
              <p className="mt-1 text-5xl font-semibold">
                {formatEuro(overview.remainingGap)}
              </p>
              <p className="mt-2 text-xs text-ink-2">
                {overview.remainingGap === 0
                  ? "Rente und Altersvorsorgedepot decken deine Wunschrente."
                  : "Nach erwarteter Rente und Altersvorsorgedepot."}
              </p>
            </Card>
            <Card>
              <ShareBar
                ariaLabel="Wunschrente pro Monat"
                formatValue={formatEuro}
                shares={[
                  {
                    label: "Nettorente",
                    value: Math.min(overview.netPension, overview.desiredPension),
                    color: "var(--series-1)",
                  },
                  {
                    label: "Altersvorsorgedepot",
                    value: overview.avDepotPension,
                    color: "var(--series-2)",
                  },
                  { label: "Verbleibende Lücke", value: overview.remainingGap },
                ]}
              />
              <dl className="mt-4 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-ink-2">Wunschrente</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatEuro(overview.desiredPension)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-2">Nötiges Kapital für die Lücke</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatEuro(overview.closing.capital)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-2">Zusätzliche Sparrate pro Monat</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatEuroCents(overview.closing.savingsRate)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-2">
                {avDepot.result
                  ? `Die zusätzliche Sparrate kommt zu den ${formatEuro(savingsRate)} pro Monat hinzu, die in dieser Rechnung ins Altersvorsorgedepot fließen. Dessen Rente läuft bis Alter ${avDepot.input.payoutUntilAge}; das Kapital für die Lücke ist mit Kapitalverzehr gerechnet.`
                  : "Das Altersvorsorgedepot ist mit den gewählten Profilen nicht berechenbar und hier nicht eingerechnet."}{" "}
                Alle Beträge nominal.
              </p>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-ink-2">
              Mit den gewählten Profilen nicht berechenbar: {pensionGap.errors[0]}
            </p>
          </Card>
        )}
      </section>

      <section aria-labelledby="calculators-heading" className="space-y-5">
        <h2 id="calculators-heading" className="text-base font-semibold">
          Ergebnisse der Rechner
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <CalculatorCard
            id="av-depot"
            errors={avDepot.errors}
            figures={
              avDepot.result && [
                {
                  label: `Endvermögen mit ${avDepot.input.retirementAge}`,
                  value: formatEuro(avDepot.result.av.finalCapital),
                },
                {
                  label: "Netto-Rente pro Monat",
                  value: formatEuro(avDepot.result.av.payout.monthlyNet),
                },
                {
                  label: "Zum Vergleich: ETF-Sparplan pro Monat",
                  value: formatEuro(avDepot.result.normal.payout.monthlyNet),
                },
                {
                  label: "Förderung gesamt",
                  value: formatEuro(
                    avDepot.result.av.allowances + avDepot.result.av.taxSavings,
                  ),
                },
              ]
            }
          />
          <CalculatorCard
            id="pension-gap"
            errors={pensionGap.errors}
            figures={
              pensionGap.result && [
                {
                  label: "Rentenlücke pro Monat",
                  value: formatEuro(pensionGap.result.gap),
                },
                {
                  label: "Nettorente pro Monat",
                  value: formatEuro(pensionGap.result.netPension),
                },
                {
                  label: "Nötiges Kapital (mit Kapitalverzehr)",
                  value: formatEuro(pensionGap.result.withConsumption.capital),
                },
                {
                  label: "Nötige Sparrate pro Monat",
                  value: formatEuroCents(
                    pensionGap.result.withConsumption.savingsRate,
                  ),
                },
              ]
            }
          />
          <CalculatorCard
            id="savings"
            errors={savings.errors}
            figures={
              savings.result && [
                {
                  label: `Gesucht: ${selectText.savings.output.options[savings.input.output]}`,
                  value: {
                    endValue: formatEuro(savings.result.endValue),
                    startValue: formatEuro(savings.result.startValue),
                    yearlyInterest: formatPercent(savings.result.yearlyInterest),
                    duration: formatYears(savings.result.durationYears),
                    savingRate: formatEuroCents(savings.result.savingRate),
                  }[savings.input.output],
                },
                savings.input.output === "endValue"
                  ? {
                      label: "Laufzeit",
                      value: formatYears(savings.result.durationYears),
                    }
                  : {
                      label: "Endkapital",
                      value: formatEuro(savings.result.endValue),
                    },
                {
                  label: "Einzahlungen gesamt",
                  value: formatEuro(savings.result.deposits),
                },
                { label: "Zinsen", value: formatEuro(savings.result.interest) },
              ]
            }
          />
          <CalculatorCard
            id="withdrawal-plan"
            errors={withdrawal.errors}
            figures={
              withdrawal.result && [
                {
                  label: "Gesucht",
                  value:
                    selectText["withdrawal-plan"].output.options[
                      withdrawal.input.output
                    ],
                },
                {
                  label: `Entnahmebetrag ${perInterval}`,
                  value: formatEuroCents(withdrawal.result.amount),
                },
                {
                  label: "Entnahmezeitraum",
                  value:
                    withdrawal.result.periodYears === null
                      ? "endlos"
                      : formatYears(withdrawal.result.periodYears),
                },
                {
                  label: "Anlagevermögen",
                  value: formatEuro(withdrawal.result.capital),
                },
              ]
            }
          />
        </div>
      </section>
    </div>
  );
}
