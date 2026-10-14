import { beforeAll, describe, expect, it } from "vitest";
import { useTempDatabase } from "@/lib/test-db";

type Settings = typeof import("@/lib/settings/store");
type Plan = typeof import("@/lib/plan/store");

let settings: Settings;
let plan: Plan;
let alice: string;
let bob: string;

beforeAll(async () => {
  useTempDatabase();
  const { getDb, schema } = await import("@/db");
  settings = await import("@/lib/settings/store");
  plan = await import("@/lib/plan/store");
  const db = await getDb();
  alice = "user-alice";
  bob = "user-bob";
  for (const id of [alice, bob]) {
    await db.insert(schema.users).values({
      id,
      email: `${id}@example.com`,
      passwordHash: "x",
      createdAt: new Date(),
    });
  }
});

const snapshot = {
  date: "2026-01-01",
  values: { av: 1, depot: 2, cash: 3 },
  contributions: { av: 0, depot: 0, cash: 0 },
  inflation: null,
  note: "",
  kpis: null,
};

describe("profiles belong to their user", () => {
  it("never shows another user's profiles", async () => {
    const created = await settings.createProfile(alice, "shared", "Secret name", {});
    expect(created.ok).toBe(true);
    const bobs = await settings.loadProfiles(bob);
    const names = Object.values(bobs).flatMap((s) => s.profiles.map((p) => p.name));
    expect(names).not.toContain("Secret name");
  });

  it("refuses to read, change, rename, activate or delete someone else's profile", async () => {
    const state = await settings.loadProfiles(alice);
    const target = state.shared.profiles[0];

    expect(await settings.saveProfileData(bob, target.id, { age: 70 })).toEqual({
      ok: false,
      error: "notFound",
    });
    expect((await settings.renameProfile(bob, target.id, "Hacked")).ok).toBe(false);
    expect((await settings.setActiveProfile(bob, target.id)).ok).toBe(false);
    expect((await settings.deleteProfile(bob, target.id)).ok).toBe(false);

    const after = await settings.loadProfiles(alice);
    const still = after.shared.profiles.find((p) => p.id === target.id);
    expect(still?.name).toBe(target.name);
    expect(still?.data).toEqual(target.data);
  });

  it("limits the number of profiles per scope", async () => {
    let last;
    for (let i = 0; i < settings.MAX_PROFILES_PER_SCOPE + 2; i++) {
      last = await settings.createProfile(bob, "savings", `P${i}`, {});
    }
    expect(last).toEqual({ ok: false, error: "tooMany" });
  });

  it("stores only valid values, whatever the client sends", async () => {
    const state = await settings.loadProfiles(alice);
    const id = state.shared.profiles[0].id;
    await settings.saveProfileData(alice, id, {
      age: 9_999,
      evil: "<script>",
      huge: "x".repeat(100_000),
    });
    const stored = (await settings.loadProfiles(alice)).shared.profiles.find(
      (p) => p.id === id,
    )!.data;
    expect(stored.age).toBeLessThanOrEqual(80);
    expect(JSON.stringify(stored)).not.toContain("evil");
    expect(JSON.stringify(stored).length).toBeLessThan(2_000);
  });
});

describe("plan records belong to their user", () => {
  it("hides records and refuses deletion for other users", async () => {
    const id = await plan.createPlanRecord(alice, "snapshot", snapshot);
    expect(id).toBeTruthy();

    expect((await plan.loadPlanRecords(bob)).snapshots).toHaveLength(0);
    expect(await plan.deletePlanRecord(bob, id!)).toBe(false);
    expect((await plan.loadPlanRecords(alice)).snapshots).toHaveLength(1);
    expect(await plan.deletePlanRecord(alice, id!)).toBe(true);
  });

  it("rejects malformed and oversized records", async () => {
    expect(await plan.createPlanRecord(alice, "snapshot", { date: "nope" })).toBeNull();
    const big = {
      date: "2026-01-01",
      label: "x",
      input: { a: "y".repeat(70_000) },
      result: {},
    };
    expect(await plan.createPlanRecord(alice, "version", big)).toBeNull();
  });

  it("limits the number of records per user", async () => {
    let last: string | null = "";
    for (let i = 0; i < plan.MAX_PLAN_RECORDS + 1; i++) {
      last = await plan.createPlanRecord(bob, "snapshot", snapshot);
    }
    expect(last).toBeNull();
  }, 60_000);
});
