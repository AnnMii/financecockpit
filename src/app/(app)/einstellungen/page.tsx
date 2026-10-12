import type { Metadata } from "next";
import { DraftBar, DraftSettings } from "@/components/draft-settings";
import { Card, Section, WithoutSharedBadges } from "@/components/fields";
import { LifeExpectancyInfo } from "@/components/life-expectancy-info";
import { ProfilePicker } from "@/components/profile-picker";
import {
  ChildrenField,
  IncomeSetting,
  NumberSetting,
  ToggleSetting,
} from "@/components/setting-fields";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).settingsPage.title };
}

export default async function SettingsPage() {
  const text = (await getDictionary()).settingsPage;
  return (
    <DraftSettings>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold">{text.title}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-2">{text.intro}</p>
        <Card className="mb-5">
          <ProfilePicker scope="shared" label={text.profileLabel} manage />
        </Card>
        <WithoutSharedBadges>
          <Card className="space-y-7">
            <Section title={text.personal}>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberSetting scope="shared" name="age" />
                <NumberSetting scope="shared" name="retirementAge" />
                <NumberSetting
                  scope="shared"
                  name="payoutUntilAge"
                  info={<LifeExpectancyInfo />}
                />
              </div>
              <ChildrenField />
            </Section>
            <Section title={text.saving}>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberSetting scope="shared" name="savingsRateMonthly" />
                <NumberSetting scope="shared" name="currentCapital" />
                <NumberSetting scope="shared" name="expectedReturn" />
                <NumberSetting scope="shared" name="retirementReturn" />
              </div>
            </Section>
            <Section title={text.inflation}>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberSetting scope="shared" name="inflationRate" />
                <ToggleSetting scope="shared" name="considerInflation" />
              </div>
            </Section>
            <Section title={text.incomeAndTax}>
              <div className="grid gap-4 sm:grid-cols-2">
                <IncomeSetting name="zveSavingsPhase" />
                <IncomeSetting name="zveRetirement" />
                <NumberSetting scope="shared" name="exemptionOrder" />
                <NumberSetting scope="shared" name="capitalGainsTax" />
              </div>
            </Section>
          </Card>
        </WithoutSharedBadges>
        <DraftBar />
      </div>
    </DraftSettings>
  );
}
