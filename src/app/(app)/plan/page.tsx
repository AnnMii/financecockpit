import type { Metadata } from "next";
import { PlanWorkspace } from "@/components/plan/plan-workspace";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).plan.pageTitle };
}

export default async function PlanPage() {
  const t = await getDictionary();
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.plan.pageTitle}</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink-2">
        {t.plan.intro} {t.common.localChangesHint}
      </p>
      <PlanWorkspace />
    </>
  );
}
