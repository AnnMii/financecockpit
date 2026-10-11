import type { Metadata } from "next";
import { WithdrawalPlanCalculator } from "@/components/withdrawal-plan/withdrawal-plan-calculator";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).calculators["withdrawal-plan"].pageTitle };
}

export default async function Page() {
  const t = await getDictionary();
  const text = t.calculators["withdrawal-plan"];
  return (
    <>
      <h1 className="text-2xl font-semibold">{text.pageTitle}</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        {text.intro} {t.common.localChangesHint}
      </p>
      <WithdrawalPlanCalculator />
    </>
  );
}
