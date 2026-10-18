import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { AppNav, SaveIndicator } from "@/components/app-nav";
import { LanguageSwitch } from "@/components/locale-provider";
import { PlanRecordsProvider } from "@/components/plan/plan-records";
import { PreferencesProvider } from "@/components/preferences-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { requireUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";
import { loadPlanRecords } from "@/lib/plan/store";
import { loadPreferences } from "@/lib/preferences-store";
import { loadProfiles } from "@/lib/settings/store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profiles = await loadProfiles(user.id);
  const planRecords = await loadPlanRecords(user.id);
  const preferences = await loadPreferences(user.id);
  const t = await getDictionary();

  return (
    <SettingsProvider initialProfiles={profiles}>
      <PlanRecordsProvider initialRecords={planRecords}>
      <PreferencesProvider initial={preferences}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="relative flex shrink-0 items-center justify-between border-b border-line px-4 py-2 lg:block lg:w-60 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <Link href="/cockpit" className="block px-3 text-base font-semibold lg:mb-6">
            {t.appName}
          </Link>
          <AppNav />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:px-8">
            <SaveIndicator />
            <span className="truncate text-sm text-ink-2">{user.email}</span>
            <LanguageSwitch />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-axis px-3 py-1.5 text-sm text-ink hover:bg-accent-wash"
              >
                {t.nav.logout}
              </button>
            </form>
          </header>
          <main className="min-w-0 px-4 py-8 sm:px-8">{children}</main>
        </div>
      </div>
      </PreferencesProvider>
      </PlanRecordsProvider>
    </SettingsProvider>
  );
}
