import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).dashboard.title };
}

export default async function CockpitPage() {
  const t = await getDictionary();
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">{t.dashboard.title}</h1>
      <Dashboard />
    </>
  );
}
