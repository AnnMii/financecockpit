"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { type AdminResult, setUserBeta, setUserRole } from "@/lib/admin/store";

// Both actions repeat the admin check inside the store; here the caller is
// only identified. Anybody can call a server action, so nothing may rely on
// the button being hidden.

export async function setUserRoleAction(
  targetId: string,
  role: string,
): Promise<AdminResult> {
  const user = await getCurrentUser();
  if (!user || typeof targetId !== "string" || typeof role !== "string") {
    return { ok: false, error: "forbidden" };
  }
  const result = await setUserRole(user.id, targetId, role);
  if (result.ok) revalidatePath("/admin");
  return result;
}

export async function setUserBetaAction(
  targetId: string,
  beta: boolean,
): Promise<AdminResult> {
  const user = await getCurrentUser();
  if (!user || typeof targetId !== "string" || typeof beta !== "boolean") {
    return { ok: false, error: "forbidden" };
  }
  const result = await setUserBeta(user.id, targetId, beta);
  if (result.ok) revalidatePath("/admin");
  return result;
}
