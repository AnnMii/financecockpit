"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { savePreferences } from "@/lib/preferences-store";

/** Remembers the "Advanced inputs" switch; returns whether it was saved. */
export async function setAdvancedInputsAction(value: boolean): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || typeof value !== "boolean") return false;
  await savePreferences(user.id, { advancedInputs: value });
  return true;
}
