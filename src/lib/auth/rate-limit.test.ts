import { beforeAll, describe, expect, it } from "vitest";
import { useTempDatabase } from "@/lib/test-db";

let limit: typeof import("./rate-limit");

beforeAll(async () => {
  useTempDatabase();
  limit = await import("./rate-limit");
});

const rule = { max: 3, windowMs: 1_000 };

describe("allowAttempt", () => {
  it("allows up to the maximum and then refuses", async () => {
    const key = limit.limitKey("t", "a@example.com");
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await limit.allowAttempt(key, rule, 100));
    expect(results).toEqual([true, true, true, false, false]);
  });

  it("starts a new window once the old one has passed", async () => {
    const key = limit.limitKey("t", "b@example.com");
    for (let i = 0; i < 3; i++) await limit.allowAttempt(key, rule, 100);
    expect(await limit.allowAttempt(key, rule, 500)).toBe(false);
    expect(await limit.allowAttempt(key, rule, 1_100)).toBe(true);
  });

  it("counts every key on its own", async () => {
    const a = limit.limitKey("t", "c@example.com");
    const b = limit.limitKey("t", "d@example.com");
    for (let i = 0; i < 3; i++) await limit.allowAttempt(a, rule, 100);
    expect(await limit.allowAttempt(a, rule, 100)).toBe(false);
    expect(await limit.allowAttempt(b, rule, 100)).toBe(true);
  });

  it("forgets a key after clearAttempts", async () => {
    const key = limit.limitKey("t", "e@example.com");
    for (let i = 0; i < 3; i++) await limit.allowAttempt(key, rule, 100);
    await limit.clearAttempts(key);
    expect(await limit.allowAttempt(key, rule, 100)).toBe(true);
  });

  it("does not store the e-mail address in clear text", () => {
    expect(limit.limitKey("login", "secret@example.com")).not.toContain("secret");
  });
});
