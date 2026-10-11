import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { AppNav, SaveIndicator } from "@/components/app-nav";
import { SettingsProvider } from "@/components/settings-provider";
import { requireUser } from "@/lib/auth/session";
import { loadProfiles } from "@/lib/settings/store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profiles = await loadProfiles(user.id);

  return (
    <SettingsProvider initialProfiles={profiles}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-line px-4 py-3 lg:w-60 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <Link href="/" className="mb-3 block px-3 text-base font-semibold lg:mb-6">
            Finanzcockpit
          </Link>
          <AppNav />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-4 border-b border-line px-4 py-3 sm:px-8">
            <SaveIndicator />
            <span className="truncate text-sm text-ink-2">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-axis px-3 py-1.5 text-sm text-ink hover:bg-accent-wash"
              >
                Abmelden
              </button>
            </form>
          </header>
          <main className="min-w-0 px-4 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </SettingsProvider>
  );
}
