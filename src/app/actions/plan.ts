"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  createPlanRecord,
  deletePlanRecord,
  isPlanRecordKind,
} from "@/lib/plan/store";

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
