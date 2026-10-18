"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setUserBetaAction, setUserRoleAction } from "@/app/actions/admin";
import { useLocale } from "@/components/locale-provider";
import { ROLES } from "@/lib/access";
import type { AdminResult } from "@/lib/admin/store";
import type { Role } from "@/lib/access";

/** One account as the page hands it over (dates as ISO strings). */
export interface AdminUserRow {
  id: string;
  email: string;
  role: Role;
  betaAccess: boolean;
  createdAt: string;
  profileCount: number;
  lastActive: string | null;
}

function formatDay(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

export function AdminUsers({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const { locale, t } = useLocale();
  const text = t.admin;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Message per account after the last change: saved, or why it failed.
  const [messages, setMessages] = useState<Record<string, { ok: boolean; text: string }>>({});

  const apply = (userId: string, change: () => Promise<AdminResult>) => {
    startTransition(async () => {
      let result: AdminResult;
      try {
        result = await change();
      } catch {
        result = { ok: false, error: "invalid" };
        setMessages((current) => ({
          ...current,
          [userId]: { ok: false, text: text.errors.failed },
        }));
        return;
      }
      setMessages((current) => ({
        ...current,
        [userId]: result.ok
          ? { ok: true, text: text.saved }
          : { ok: false, text: text.errors[result.error] },
      }));
      router.refresh();
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <thead className="text-xs text-ink-2">
          <tr className="border-b border-line">
            <th className="px-3 py-2 text-left font-medium">{text.columns.email}</th>
            <th className="px-3 py-2 text-left font-medium">{text.columns.registered}</th>
            <th className="px-3 py-2 text-left font-medium">{text.columns.role}</th>
            <th className="px-3 py-2 text-left font-medium">{text.columns.beta}</th>
            <th className="px-3 py-2 text-right font-medium">{text.columns.profiles}</th>
            <th className="px-3 py-2 text-left font-medium">{text.columns.lastActive}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const message = messages[user.id];
            return (
              <tr key={user.id} className="border-b border-line align-top last:border-0">
                <td className="px-3 py-2">
                  <span className="break-all">{user.email}</span>
                  {isSelf && <span className="ml-2 text-xs text-muted">({text.you})</span>}
                  {message && (
                    <span
                      role="status"
                      className={`mt-1 block text-xs ${message.ok ? "text-good" : "text-critical"}`}
                    >
                      {message.text}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {formatDay(locale, user.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={user.role}
                    disabled={isSelf || pending}
                    aria-label={`${text.columns.role}: ${user.email}`}
                    onChange={(event) =>
                      apply(user.id, () => setUserRoleAction(user.id, event.target.value))
                    }
                    className="rounded-md border border-axis bg-surface px-2 py-1 text-sm disabled:opacity-60"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {text.roles[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  {user.role === "admin" ? (
                    <span className="text-xs text-ink-2">{text.betaImplied}</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={user.betaAccess}
                      disabled={pending}
                      title={text.betaTitle}
                      aria-label={`${text.betaTitle}: ${user.email}`}
                      onChange={(event) =>
                        apply(user.id, () => setUserBetaAction(user.id, event.target.checked))
                      }
                      className="size-4 accent-(--accent)"
                    />
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{user.profileCount}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {user.lastActive ? formatDay(locale, user.lastActive) : text.never}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
