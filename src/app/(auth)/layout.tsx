import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitch } from "@/components/locale-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getCurrentUser()) redirect("/cockpit");
  const t = await getDictionary();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            {t.appName}
          </Link>
          <LanguageSwitch />
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
