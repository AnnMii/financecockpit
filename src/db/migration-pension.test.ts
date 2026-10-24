import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { useTempDatabase } from "@/lib/test-db";

/** The migration that moved the pension values to the global profiles, run on old-style data. */
describe("migration 0008: pension values become global values", () => {
  const sql = readFileSync(join(process.cwd(), "drizzle", "0008_pension_to_shared.sql"), "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  let client: Awaited<ReturnType<typeof import("@/db").getDb>>["$client"];

  const profile = (id: string, userId: string, scope: string, data: string, active: boolean) =>
    client.execute({
      sql: "insert into profiles (id, user_id, scope, name, data, is_active, created_at, updated_at) values (?, ?, ?, ?, ?, ?, 0, 0)",
      args: [id, userId, scope, id, data, active ? 1 : 0],
    });
  const dataOf = async (id: string) =>
    JSON.parse(String((await client.execute({ sql: "select data from profiles where id = ?", args: [id] })).rows[0].data));

  beforeAll(async () => {
    useTempDatabase();
    const { getDb } = await import("@/db");
    client = (await getDb()).$client;
    for (const id of ["u1", "u2", "u3"]) {
      await client.execute({
        sql: "insert into users (id, email, password_hash, created_at) values (?, ?, 'x', 0)",
        args: [id, `${id}@example.com`],
      });
    }
    const old = (desired: number) =>
      JSON.stringify({ statePension: 1500, companyPension: 50, privatePension: 0, riesterPension: 10, taxPrediction: 20, yearlyTaxFreeAmount: 12000, desiredPension: desired, savingsLikeCalculator: true });
    // u1: two global profiles, an active and an inactive pension gap profile
    await profile("u1-shared-a", "u1", "shared", JSON.stringify({ age: 40 }), true);
    await profile("u1-shared-b", "u1", "shared", JSON.stringify({ age: 50 }), false);
    await profile("u1-gap-active", "u1", "pension-gap", old(2500), true);
    await profile("u1-gap-other", "u1", "pension-gap", old(999), false);
    // u2: no pension gap profile at all
    await profile("u2-shared", "u2", "shared", JSON.stringify({ age: 30 }), true);
    // u3: damaged data stays as it is
    await profile("u3-shared", "u3", "shared", "not json", true);
    await profile("u3-gap", "u3", "pension-gap", "{broken", true);
    for (const statement of sql) await client.execute(statement);
  });

  it("copies the active pension gap values into every global profile of the user", async () => {
    for (const id of ["u1-shared-a", "u1-shared-b"]) {
      expect(await dataOf(id)).toMatchObject({ statePension: 1500, companyPension: 50, riesterPension: 10, taxPrediction: 20, yearlyTaxFreeAmount: 12000, desiredPension: 2500 });
    }
    expect((await dataOf("u1-shared-a")).age).toBe(40);
    expect((await dataOf("u1-shared-b")).age).toBe(50);
  });

  it("removes them from the pension gap profiles and keeps what stays there", async () => {
    for (const id of ["u1-gap-active", "u1-gap-other"]) {
      expect(await dataOf(id)).toEqual({ savingsLikeCalculator: true });
    }
  });

  it("leaves users without a pension gap profile and damaged data alone", async () => {
    expect(await dataOf("u2-shared")).toEqual({ age: 30 });
    const rows = (await client.execute("select id, data from profiles where id in ('u3-shared','u3-gap') order by id")).rows;
    expect(rows.map((r) => r.data)).toEqual(["{broken", "not json"]);
  });
});
