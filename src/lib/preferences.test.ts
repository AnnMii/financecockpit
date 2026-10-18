import { beforeAll, describe, expect, it } from "vitest";
import { useTempDatabase } from "@/lib/test-db";
import { DEFAULT_PREFERENCES, parsePreferences } from "./preferences";

describe("parsePreferences", () => {
  it("falls back to the defaults for anything unknown or malformed", () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("text")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ advancedInputs: "yes" })).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences({ advancedInputs: true, other: 1 })).toEqual({
      advancedInputs: true,
    });
  });
});

describe("stored preferences", () => {
  let store: typeof import("./preferences-store");

  beforeAll(async () => {
    useTempDatabase();
    const { getDb, schema } = await import("@/db");
    store = await import("./preferences-store");
    const db = await getDb();
    for (const id of ["pref-alice", "pref-bob"]) {
      await db.insert(schema.users).values({
        id,
        email: `${id}@example.com`,
        passwordHash: "x",
        createdAt: new Date(),
      });
    }
  });

  it("starts with the defaults", async () => {
    expect(await store.loadPreferences("pref-alice")).toEqual(DEFAULT_PREFERENCES);
  });

  it("remembers a choice per account", async () => {
    await store.savePreferences("pref-alice", { advancedInputs: true });
    expect(await store.loadPreferences("pref-alice")).toEqual({ advancedInputs: true });
    expect(await store.loadPreferences("pref-bob")).toEqual(DEFAULT_PREFERENCES);
    await store.savePreferences("pref-alice", { advancedInputs: false });
    expect((await store.loadPreferences("pref-alice")).advancedInputs).toBe(false);
  });

  it("copes with a user that does not exist", async () => {
    expect(await store.loadPreferences("nobody")).toEqual(DEFAULT_PREFERENCES);
  });
});
