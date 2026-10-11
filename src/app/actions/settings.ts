"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { isSettingsScope, parseSettings } from "@/lib/settings/schema";
import { saveSettings } from "@/lib/settings/store";

export async function saveSettingsAction(
  scope: string,
  data: unknown,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !isSettingsScope(scope)) return { ok: false };

  await saveSettings(user.id, scope, parseSettings(scope, data));
  return { ok: true };
}
