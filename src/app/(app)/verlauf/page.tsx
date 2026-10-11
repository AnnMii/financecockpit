import type { Metadata } from "next";
import { PlanHistory } from "@/components/plan/plan-history";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).plan.historyTitle };
}

export default async function HistoryPage() {
  const t = await getDictionary();
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.plan.historyTitle}</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">{t.plan.historyIntro}</p>
      <PlanHistory />
    </>
  );
}
