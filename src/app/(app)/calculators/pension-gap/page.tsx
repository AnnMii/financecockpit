import type { Metadata } from "next";
import { PensionGapCalculator } from "@/components/pension-gap/pension-gap-calculator";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).calculators["pension-gap"].pageTitle };
}

export default async function Page() {
  const t = await getDictionary();
  const text = t.calculators["pension-gap"];
  return (
    <>
      <h1 className="text-2xl font-semibold">{text.pageTitle}</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        {text.intro} {t.common.localChangesHint}
      </p>
      <PensionGapCalculator />
    </>
  );
}
