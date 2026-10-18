import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { type Role, isRole } from "@/lib/access";
import { parsePreferences } from "@/lib/preferences";
import {
  SETTINGS_SCOPES,
  type SettingsScope,
  defaultSettings,
  parseSettings,
} from "@/lib/settings/schema";

/**
 * Everything the admin portal reads and changes. Each function checks again
 * that the acting account is an admin, whatever the caller (a page, a server
 * action) has checked before: the data layer does not trust its callers.
 */

export type AdminError = "forbidden" | "notFound" | "self" | "lastAdmin" | "invalid";
export type AdminResult = { ok: true } | { ok: false; error: AdminError };

const { users, profiles, planRecords, adminLog } = schema;

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  betaAccess: boolean;
  createdAt: Date;
  profileCount: number;
  planRecordCount: number;
  /** When a profile was last saved; null if never. */
  lastActive: Date | null;
}

export interface UsageStats {
  totals: {
    users: number;
    admins: number;
    beta: number;
    /** Accounts that saved a profile within the last 30 days. */
    active30: number;
    withPlanRecords: number;
    advancedInputs: number;
  };
  /** New accounts per month, the last 12 months, oldest first. */
  signups: { month: string; count: number }[];
  scopes: { scope: SettingsScope; profiles: number; usersCustomised: number }[];
}

export interface LogEntry {
  at: Date;
  actor: string;
  target: string;
  action: string;
  detail: string;
}

async function isAdmin(actorId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1);
  return row?.role === "admin";
}

const asRole = (value: string): Role => (isRole(value) ? value : "user");

export async function listUsers(actorId: string): Promise<AdminUser[] | null> {
  if (!(await isAdmin(actorId))) return null;
  const db = await getDb();
  const rows = await db.select().from(users).orderBy(users.createdAt);
  const perProfile = await db
    .select({
      userId: profiles.userId,
      n: sql<number>`count(*)`,
      last: sql<number>`max(${profiles.updatedAt})`,
    })
    .from(profiles)
    .groupBy(profiles.userId);
  const perRecord = await db
    .select({ userId: planRecords.userId, n: sql<number>`count(*)` })
    .from(planRecords)
    .groupBy(planRecords.userId);

  return rows.map((user) => {
    const own = perProfile.find((p) => p.userId === user.id);
    return {
      id: user.id,
      email: user.email,
      role: asRole(user.role),
      betaAccess: user.betaAccess,
      createdAt: user.createdAt,
      profileCount: own ? Number(own.n) : 0,
      planRecordCount: Number(perRecord.find((p) => p.userId === user.id)?.n ?? 0),
      lastActive: own?.last ? new Date(Number(own.last) * 1000) : null,
    };
  });
}

async function log(
  actorId: string,
  targetId: string,
  action: "role" | "beta",
  detail: string,
) {
  const db = await getDb();
  await db
    .insert(adminLog)
    .values({ id: randomUUID(), actorId, targetId, action, detail, createdAt: new Date() });
}

async function findUser(userId: string) {
  const db = await getDb();
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return row;
}

export async function setUserRole(
  actorId: string,
  targetId: string,
  role: string,
): Promise<AdminResult> {
  if (!isRole(role)) return { ok: false, error: "invalid" };
  if (!(await isAdmin(actorId))) return { ok: false, error: "forbidden" };
  const target = await findUser(targetId);
  if (!target) return { ok: false, error: "notFound" };
  // Nobody changes their own role: that is how the last admin would lock everyone out.
  if (actorId === targetId) return { ok: false, error: "self" };
  if (target.role === role) return { ok: true };

  const db = await getDb();
  if (target.role === "admin") {
    const [{ admins }] = await db
      .select({ admins: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));
    if (Number(admins) <= 1) return { ok: false, error: "lastAdmin" };
  }

  await db.update(users).set({ role }).where(eq(users.id, targetId));
  await log(actorId, targetId, "role", `${target.role} -> ${role}`);
  return { ok: true };
}

export async function setUserBeta(
  actorId: string,
  targetId: string,
  beta: boolean,
): Promise<AdminResult> {
  if (typeof beta !== "boolean") return { ok: false, error: "invalid" };
  if (!(await isAdmin(actorId))) return { ok: false, error: "forbidden" };
  const target = await findUser(targetId);
  if (!target) return { ok: false, error: "notFound" };
  if (target.betaAccess === beta) return { ok: true };
  const db = await getDb();
  await db.update(users).set({ betaAccess: beta }).where(eq(users.id, targetId));
  await log(actorId, targetId, "beta", beta ? "off -> on" : "on -> off");
  return { ok: true };
}

export async function recentChanges(
  actorId: string,
  limit = 20,
): Promise<LogEntry[] | null> {
  if (!(await isAdmin(actorId))) return null;
  const db = await getDb();
  const [entries, accounts] = await Promise.all([
    // Times are whole seconds; the row id keeps changes of the same second in order.
    db
      .select()
      .from(adminLog)
      .orderBy(desc(adminLog.createdAt), sql`rowid desc`)
      .limit(limit),
    db.select({ id: users.id, email: users.email }).from(users),
  ]);
  // An account that was deleted since is shown by the start of its id.
  // Changes made with scripts/account.mjs on the server are logged as "cli".
  const name = (id: string) =>
    id === "cli"
      ? "server (CLI)"
      : (accounts.find((a) => a.id === id)?.email ?? `(${id.slice(0, 8)}, deleted)`);
  return entries.map((entry) => ({
    at: entry.createdAt,
    actor: name(entry.actorId),
    target: name(entry.targetId),
    action: entry.action,
    detail: entry.detail,
  }));
}

/**
 * Figures taken from what accounts store anyway; nothing is tracked on the
 * side. "Customised" means a profile that differs from the defaults.
 */
export async function usageStats(
  actorId: string,
  now: Date = new Date(),
): Promise<UsageStats | null> {
  if (!(await isAdmin(actorId))) return null;
  const db = await getDb();
  const [accounts, allProfiles, records] = await Promise.all([
    db.select().from(users),
    db.select().from(profiles),
    db.select({ userId: planRecords.userId }).from(planRecords),
  ]);

  const since = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const active = new Set(
    allProfiles.filter((p) => p.updatedAt.getTime() >= since).map((p) => p.userId),
  );

  const defaults = defaultSettings();
  const scopes = SETTINGS_SCOPES.map((scope) => {
    const own = allProfiles.filter((p) => p.scope === scope);
    const baseline = JSON.stringify(defaults[scope]);
    const customised = new Set(
      own
        .filter((p) => {
          try {
            return JSON.stringify(parseSettings(scope, JSON.parse(p.data))) !== baseline;
          } catch {
            return false;
          }
        })
        .map((p) => p.userId),
    );
    return { scope, profiles: own.length, usersCustomised: customised.size };
  });

  const signups: UsageStats["signups"] = [];
  for (let back = 11; back >= 0; back--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const month = date.toISOString().slice(0, 7);
    signups.push({
      month,
      count: accounts.filter((a) => a.createdAt.toISOString().slice(0, 7) === month).length,
    });
  }

  let advancedInputs = 0;
  for (const account of accounts) {
    try {
      if (parsePreferences(JSON.parse(account.preferences)).advancedInputs) advancedInputs++;
    } catch {
      // Unreadable preferences count as the default.
    }
  }

  return {
    totals: {
      users: accounts.length,
      admins: accounts.filter((a) => a.role === "admin").length,
      beta: accounts.filter((a) => a.betaAccess).length,
      active30: active.size,
      withPlanRecords: new Set(records.map((r) => r.userId)).size,
      advancedInputs,
    },
    signups,
    scopes,
  };
}
