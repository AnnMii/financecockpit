import type { Metadata } from "next";
import { AdminUsers } from "@/components/admin/admin-users";
import { listUsers, recentChanges, usageStats } from "@/lib/admin/store";
import { requireAdmin } from "@/lib/auth/session";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).admin.title };
}

const card = "rounded-xl border border-line bg-surface p-5";

export default async function AdminPage() {
  // Anybody else gets "not found", as if the page did not exist.
  const user = await requireAdmin();
  const t = await getDictionary();
  const locale = await getLocale();
  const text = t.admin;

  const [users, stats, changes] = await Promise.all([
    listUsers(user.id),
    usageStats(user.id),
    recentChanges(user.id),
  ]);
  if (!users || !stats || !changes) return null;

  const day = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const month = new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit", timeZone: "UTC" });
  const maxSignups = Math.max(1, ...stats.signups.map((s) => s.count));
  const totals = [
    ["users", stats.totals.users],
    ["admins", stats.totals.admins],
    ["beta", stats.totals.beta],
    ["active30", stats.totals.active30],
    ["withPlanRecords", stats.totals.withPlanRecords],
    ["advancedInputs", stats.totals.advancedInputs],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{text.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-2">{text.intro}</p>
      </div>

      <section aria-labelledby="stats">
        <h2 id="stats" className="mb-1 text-lg font-semibold">
          {text.statsHeading}
        </h2>
        <p className="mb-4 text-xs text-ink-2">
          {text.statsNote} {text.active30Hint}
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {totals.map(([key, value]) => (
            <div key={key} className={card}>
              <dt className="text-xs text-ink-2">{text.totals[key]}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <h3 className="mb-3 text-sm font-semibold">{text.signupsHeading}</h3>
            <ul className="space-y-1.5 text-sm">
              {stats.signups.map((entry) => (
                <li key={entry.month} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs text-ink-2">
                    {month.format(new Date(`${entry.month}-01T00:00:00Z`))}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-3 rounded-sm bg-(--series-1)"
                    style={{ width: `${(entry.count / maxSignups) * 100}%`, minWidth: entry.count ? 4 : 0 }}
                  />
                  <span className="tabular-nums">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={card}>
            <h3 className="mb-3 text-sm font-semibold">{text.scopesHeading}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-ink-2">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 text-left font-medium">{text.scopeColumns.scope}</th>
                    <th className="px-3 py-2 text-right font-medium">{text.scopeColumns.profiles}</th>
                    <th className="py-2 pl-3 text-right font-medium">{text.scopeColumns.customised}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.scopes.map((scope) => (
                    <tr key={scope.scope} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3">{t.scopes[scope.scope]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{scope.profiles}</td>
                      <td className="py-2 pl-3 text-right tabular-nums">{scope.usersCustomised}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="users">
        <h2 id="users" className="mb-3 text-lg font-semibold">
          {text.usersHeading}
        </h2>
        <div className={card}>
          <AdminUsers
            currentUserId={user.id}
            users={users.map((entry) => ({
              id: entry.id,
              email: entry.email,
              role: entry.role,
              betaAccess: entry.betaAccess,
              createdAt: entry.createdAt.toISOString(),
              profileCount: entry.profileCount,
              lastActive: entry.lastActive?.toISOString() ?? null,
            }))}
          />
        </div>
      </section>

      <section aria-labelledby="changes">
        <h2 id="changes" className="mb-3 text-lg font-semibold">
          {text.changesHeading}
        </h2>
        <div className={card}>
          {changes.length === 0 ? (
            <p className="text-sm text-ink-2">{text.noChanges}</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {changes.map((entry) => (
                <li key={`${entry.at.toISOString()}-${entry.target}-${entry.action}`} className="py-2">
                  <span className="text-xs text-ink-2">{day.format(entry.at)}</span>{" "}
                  <span className="break-all">
                    {entry.actor} → {entry.target}
                  </span>{" "}
                  <span className="text-ink-2">
                    {text.changeKinds[entry.action as "role" | "beta"] ?? entry.action}: {entry.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
