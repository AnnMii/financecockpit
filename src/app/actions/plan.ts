"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  type PlanRecords,
  createPlanRecord,
  deletePlanRecord,
  isPlanRecordKind,
  loadPlanRecords,
} from "@/lib/plan/store";

/** All plan versions and snapshots of the signed-in user, for tabs that catch up. */
export async function loadPlanRecordsAction(): Promise<PlanRecords | null> {
  const user = await getCurrentUser();
  return user ? loadPlanRecords(user.id) : null;
}

/** Stores a plan version or snapshot; returns its id, or null when refused. */
export async function createPlanRecordAction(
  kind: string,
  data: unknown,
): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || !isPlanRecordKind(kind)) return null;
  return createPlanRecord(user.id, kind, data);
}

export async function deletePlanRecordAction(id: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || typeof id !== "string") return false;
  return deletePlanRecord(user.id, id);
}
