import type { Metadata } from "next";
import { Card, Section } from "@/components/fields";
import { ProfilePicker } from "@/components/profile-picker";
import {
  ChildrenField,
  NumberSetting,
  ToggleSetting,
} from "@/components/setting-fields";

export const metadata: Metadata = { title: "Einstellungen" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>
      <p className="mb-6 mt-1 text-sm text-ink-2">
        Diese Werte teilen sich die Rechner. Änderungen werden automatisch im
        gewählten Profil gespeichert.
      </p>
      <Card className="mb-5">
        <ProfilePicker scope="shared" label="Profil der globalen Werte" manage />
      </Card>
      <Card className="space-y-7">
        <Section title="Persönliche Daten">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberSetting scope="shared" name="age" />
            <NumberSetting scope="shared" name="retirementAge" />
            <NumberSetting scope="shared" name="payoutUntilAge" />
          </div>
          <ChildrenField />
        </Section>
        <Section title="Sparen und Anlegen">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberSetting scope="shared" name="savingsRateMonthly" />
            <NumberSetting scope="shared" name="currentCapital" />
            <NumberSetting scope="shared" name="expectedReturn" />
            <NumberSetting scope="shared" name="retirementReturn" />
          </div>
        </Section>
        <Section title="Inflation">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberSetting scope="shared" name="inflationRate" />
            <ToggleSetting scope="shared" name="considerInflation" />
          </div>
        </Section>
        <Section title="Einkommen und Steuern">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberSetting scope="shared" name="zveSavingsPhase" />
            <NumberSetting scope="shared" name="zveRetirement" />
            <NumberSetting scope="shared" name="exemptionOrder" />
            <NumberSetting scope="shared" name="capitalGainsTax" />
          </div>
        </Section>
      </Card>
    </div>
  );
}
