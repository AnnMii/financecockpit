import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  type AllSettings,
  type SettingsScope,
  defaultSettings,
  isSettingsScope,
  parseSettings,
} from "./schema";

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function loadSettings(userId: string): Promise<AllSettings> {
  const db = await getDb();
  const rows = await db
    .select({ scope: schema.settings.scope, data: schema.settings.data })
    .from(schema.settings)
    .where(eq(schema.settings.userId, userId));

  const result: Record<string, unknown> = defaultSettings();
  for (const row of rows) {
    if (isSettingsScope(row.scope)) {
      result[row.scope] = parseSettings(row.scope, safeJson(row.data));
    }
  }
  return result as AllSettings;
}

export async function saveSettings<S extends SettingsScope>(
  userId: string,
  scope: S,
  data: AllSettings[S],
): Promise<void> {
  const db = await getDb();
  const values = {
    userId,
    scope,
    data: JSON.stringify(data),
    updatedAt: new Date(),
  };
  await db
    .insert(schema.settings)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.settings.userId, schema.settings.scope],
      set: { data: values.data, updatedAt: values.updatedAt },
    });
}
