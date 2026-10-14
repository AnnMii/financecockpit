import "server-only";
import { createHash } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, schema } from "@/db";

const { rateLimits } = schema;

export interface Limit {
  /** Attempts allowed per window. */
  max: number;
  windowMs: number;
}

const MINUTE = 60_000;

export const LIMITS = {
  loginPerEmail: { max: 10, windowMs: 15 * MINUTE },
  loginPerIp: { max: 40, windowMs: 15 * MINUTE },
  registerPerIp: { max: 5, windowMs: 60 * MINUTE },
} satisfies Record<string, Limit>;

/** Hashed so the table holds no e-mail addresses or IPs in clear text. */
export function limitKey(kind: string, value: string): string {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${kind}:${digest}`;
}

/**
 * Counts one attempt under `key` and tells whether it is still allowed.
 * The counter restarts when its window has passed.
 */
export async function allowAttempt(
  key: string,
  limit: Limit,
  now: number = Date.now(),
): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.key, key))
    .limit(1);

  if (!row || now - row.windowStart >= limit.windowMs) {
    await db
      .insert(rateLimits)
      .values({ key, count: 1, windowStart: now })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: 1, windowStart: now },
      });
    return true;
  }
  if (row.count >= limit.max) return false;
  await db
    .update(rateLimits)
    .set({ count: row.count + 1 })
    .where(eq(rateLimits.key, key));
  return true;
}

export async function clearAttempts(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}

/** Drops counters whose window is long over, so the table stays small. */
export async function pruneAttempts(now: number = Date.now()): Promise<void> {
  const db = await getDb();
  await db.delete(rateLimits).where(lt(rateLimits.windowStart, now - 2 * 60 * MINUTE));
}

/**
 * The client address as the reverse proxy (Caddy) reports it. Caddy replaces
 * any X-Forwarded-For sent by the client, so the first entry can be trusted
 * as long as the app is only reachable through the proxy.
 */
export async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
