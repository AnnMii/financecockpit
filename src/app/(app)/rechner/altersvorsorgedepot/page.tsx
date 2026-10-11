import type { Metadata } from "next";
import { AvDepotCalculator } from "@/components/av-depot/av-depot-calculator";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).calculators["av-depot"].pageTitle };
}

export default async function Page() {
  const t = await getDictionary();
  const text = t.calculators["av-depot"];
  return (
    <>
      <h1 className="text-2xl font-semibold">{text.pageTitle}</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        {text.intro} {t.common.localChangesHint}
      </p>
      <AvDepotCalculator />
    </>
  );
}
