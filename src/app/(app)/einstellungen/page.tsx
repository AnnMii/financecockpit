import type { Metadata } from "next";
import { Card, Section } from "@/components/fields";
import { ChildrenField, SharedField } from "@/components/setting-fields";

export const metadata: Metadata = { title: "Einstellungen" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <p className="mb-6 mt-1 text-sm text-ink-2">
        Diese Angaben teilen sich alle Rechner. Änderungen werden automatisch in
        deinem Konto gespeichert.
      </p>
      <Card className="space-y-7">
        <Section title="Persönliche Daten">
          <div className="grid gap-4 sm:grid-cols-2">
            <SharedField name="age" />
            <SharedField name="retirementAge" />
          </div>
          <ChildrenField />
        </Section>
        <Section title="Sparen und Anlegen">
          <div className="grid gap-4 sm:grid-cols-2">
            <SharedField name="savingsRateMonthly" />
            <SharedField name="expectedReturn" />
          </div>
        </Section>
        <Section title="Einkommen und Steuern">
          <div className="grid gap-4 sm:grid-cols-2">
            <SharedField name="zveSavingsPhase" />
            <SharedField name="zveRetirement" />
            <SharedField name="exemptionOrder" />
          </div>
        </Section>
      </Card>
    </div>
  );
}
