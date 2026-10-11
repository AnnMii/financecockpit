import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { PlanVersion, Snapshot } from "./tracking";

const { planRecords } = schema;

export const MAX_PLAN_RECORDS = 300;
const MAX_RECORD_BYTES = 64_000;

export interface PlanRecords {
  versions: PlanVersion[];
  snapshots: Snapshot[];
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const amount = z.number().min(-1_000_000_000).max(1_000_000_000);
const pots = z.object({ av: amount, depot: amount, cash: amount });

const snapshotSchema = z.object({
  date,
  values: pots,
  contributions: pots,
  inflation: z.number().min(-20).max(100).nullable(),
  note: z.string().max(200),
  kpis: z
    .object({
      probability: z.number(),
      requiredRate: z.number(),
      currentRate: z.number(),
    })
    .nullable(),
});

// The plan itself is computed in the browser; the server only stores it.
const versionSchema = z.object({
  date,
  label: z.string().trim().min(1).max(60),
  input: z.record(z.string(), z.unknown()),
  result: z.record(z.string(), z.unknown()),
});

const schemas = { snapshot: snapshotSchema, version: versionSchema };
export type PlanRecordKind = keyof typeof schemas;

export function isPlanRecordKind(value: unknown): value is PlanRecordKind {
  return value === "snapshot" || value === "version";
}

export async function loadPlanRecords(userId: string): Promise<PlanRecords> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(planRecords)
    .where(eq(planRecords.userId, userId))
    .orderBy(asc(planRecords.createdAt));

  const records: PlanRecords = { versions: [], snapshots: [] };
  for (const row of rows) {
    try {
      const record = { ...JSON.parse(row.data), id: row.id };
      if (row.kind === "version") records.versions.push(record);
      if (row.kind === "snapshot") records.snapshots.push(record);
    } catch {
      // A record that cannot be read is left out rather than breaking the page.
    }
  }
  return records;
}

/** Stores a record and returns its id, or null when it is not acceptable. */
export async function createPlanRecord(
  userId: string,
  kind: PlanRecordKind,
  data: unknown,
): Promise<string | null> {
  const parsed = schemas[kind].safeParse(data);
  if (!parsed.success) return null;
  const json = JSON.stringify(parsed.data);
  if (json.length > MAX_RECORD_BYTES) return null;

  const db = await getDb();
  const existing = await db
    .select({ id: planRecords.id })
    .from(planRecords)
    .where(eq(planRecords.userId, userId));
  if (existing.length >= MAX_PLAN_RECORDS) return null;

  const id = randomUUID();
  await db
    .insert(planRecords)
    .values({ id, userId, kind, data: json, createdAt: new Date() });
  return id;
}

export async function deletePlanRecord(
  userId: string,
  id: string,
): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(planRecords)
    .where(and(eq(planRecords.id, id), eq(planRecords.userId, userId)))
    .returning({ id: planRecords.id });
  return deleted.length > 0;
}
