import { beforeAll, describe, expect, it } from "vitest";
import { restrictSettings } from "@/lib/access";
import { defaultSettings } from "@/lib/settings/schema";
import { useTempDatabase } from "@/lib/test-db";

type Store = typeof import("./store");
let admin: Store;

const ADMIN = "adm-1";
const SECOND_ADMIN = "adm-2";
const USER = "usr-1";
const OTHER = "usr-2";

beforeAll(async () => {
  useTempDatabase();
  const { getDb, schema } = await import("@/db");
  admin = await import("./store");
  const db = await getDb();
  const make = (id: string, role: string) =>
    db.insert(schema.users).values({
      id,
      email: `${id}@example.com`,
      passwordHash: "x",
      createdAt: new Date(),
      role,
    });
  await make(ADMIN, "admin");
  await make(USER, "user");
  await make(OTHER, "user");
});

describe("admin data layer", () => {
  it("refuses everything to an account that is not an admin", async () => {
    expect(await admin.listUsers(USER)).toBeNull();
    expect(await admin.usageStats(USER)).toBeNull();
    expect(await admin.recentChanges(USER)).toBeNull();
    expect(await admin.setUserRole(USER, OTHER, "admin")).toEqual({ ok: false, error: "forbidden" });
    expect(await admin.setUserBeta(USER, OTHER, true)).toEqual({ ok: false, error: "forbidden" });
    expect(await admin.listUsers("nobody")).toBeNull();
  });

  it("lists the accounts with their role and beta flag", async () => {
    const list = (await admin.listUsers(ADMIN))!;
    expect(list.map((u) => u.id).sort()).toEqual([ADMIN, OTHER, USER].sort());
    expect(list.find((u) => u.id === ADMIN)).toMatchObject({ role: "admin", betaAccess: false });
  });

  it("switches beta access on and off and writes a log entry", async () => {
    expect(await admin.setUserBeta(ADMIN, USER, true)).toEqual({ ok: true });
    expect((await admin.listUsers(ADMIN))!.find((u) => u.id === USER)!.betaAccess).toBe(true);
    expect(await admin.setUserBeta(ADMIN, USER, false)).toEqual({ ok: true });
    const log = (await admin.recentChanges(ADMIN))!;
    expect(log.slice(0, 2).map((e) => e.detail)).toEqual(["on -> off", "off -> on"]);
    expect(log[0]).toMatchObject({ actor: `${ADMIN}@example.com`, target: `${USER}@example.com`, action: "beta" });
  });

  it("does not log a change that changes nothing", async () => {
    const before = (await admin.recentChanges(ADMIN))!.length;
    await admin.setUserBeta(ADMIN, USER, false);
    expect((await admin.recentChanges(ADMIN))!.length).toBe(before);
  });

  it("promotes and demotes, but never the last admin and never oneself", async () => {
    expect(await admin.setUserRole(ADMIN, ADMIN, "user")).toEqual({ ok: false, error: "self" });
    expect(await admin.setUserRole(ADMIN, USER, "boss")).toEqual({ ok: false, error: "invalid" });
    expect(await admin.setUserRole(ADMIN, "missing", "admin")).toEqual({ ok: false, error: "notFound" });

    expect(await admin.setUserRole(ADMIN, USER, "admin")).toEqual({ ok: true });
    // A second admin may now demote the first, but not leave nobody.
    expect(await admin.setUserRole(USER, ADMIN, "user")).toEqual({ ok: true });
    expect(await admin.setUserRole(USER, OTHER, "admin")).toEqual({ ok: true });
    expect(await admin.setUserRole(OTHER, USER, "user")).toEqual({ ok: true });
    // OTHER is now the only admin; there is nobody who could demote them.
    expect(await admin.setUserRole(USER, OTHER, "user")).toEqual({ ok: false, error: "forbidden" });
    const roles = Object.fromEntries((await admin.listUsers(OTHER))!.map((u) => [u.id, u.role]));
    expect(roles).toEqual({ [ADMIN]: "user", [USER]: "user", [OTHER]: "admin" });
  });

  it("keeps at least one admin when a second one tries to demote the last", async () => {
    const { getDb, schema } = await import("@/db");
    const db = await getDb();
    await db.insert(schema.users).values({
      id: SECOND_ADMIN,
      email: "second@example.com",
      passwordHash: "x",
      createdAt: new Date(),
      role: "admin",
    });
    // Two admins (OTHER, SECOND_ADMIN): one demotes the other, leaving one.
    expect(await admin.setUserRole(OTHER, SECOND_ADMIN, "user")).toEqual({ ok: true });
    expect((await admin.usageStats(OTHER))!.totals.admins).toBe(1);
  });

  it("evaluates what the accounts store", async () => {
    const stats = (await admin.usageStats(OTHER))!;
    expect(stats.totals.users).toBe(4);
    expect(stats.signups).toHaveLength(12);
    expect(stats.signups.at(-1)!.count).toBe(4);
    expect(stats.scopes.map((s) => s.scope)).toContain("savings");
  });
});

describe("restrictSettings", () => {
  const settings = defaultSettings();
  const beta = { role: "user", beta: true } as const;
  const plain = { role: "user", beta: false } as const;

  it("leaves everything alone with beta access", () => {
    const savings = { ...settings.savings, output: "startValue" as const };
    expect(restrictSettings("savings", savings, beta).output).toBe("startValue");
  });

  it("falls back to the first calculation without beta access", () => {
    const savings = { ...settings.savings, output: "savingRate" as const };
    expect(restrictSettings("savings", savings, plain).output).toBe("endValue");
    const withdrawal = { ...settings["withdrawal-plan"], output: "capital" as const };
    expect(restrictSettings("withdrawal-plan", withdrawal, plain).output).toBe("amount");
  });

  it("does not touch the other values or the other calculators", () => {
    const savings = { ...settings.savings, output: "duration" as const, savingsRateMonthly: 321 };
    expect(restrictSettings("savings", savings, plain).savingsRateMonthly).toBe(321);
    expect(restrictSettings("av-depot", settings["av-depot"], plain)).toBe(settings["av-depot"]);
  });
});
