import type { Metadata } from "next";
import { SavingsCalculator } from "@/components/savings/savings-calculator";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).calculators["savings"].pageTitle };
}

export default async function Page() {
  const t = await getDictionary();
  const text = t.calculators["savings"];
  return (
    <>
      <h1 className="text-2xl font-semibold">{text.pageTitle}</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        {text.intro} {t.common.localChangesHint}
      </p>
      <SavingsCalculator />
    </>
  );
}
