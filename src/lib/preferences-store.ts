import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { type Preferences, parsePreferences } from "./preferences";

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function loadPreferences(userId: string): Promise<Preferences> {
  const db = await getDb();
  const [row] = await db
    .select({ preferences: schema.users.preferences })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  return parsePreferences(row ? parseJson(row.preferences) : {});
}

/** Changes some preferences and returns all of them. */
export async function savePreferences(
  userId: string,
  patch: Partial<Preferences>,
): Promise<Preferences> {
  const next = parsePreferences({ ...(await loadPreferences(userId)), ...patch });
  const db = await getDb();
  await db
    .update(schema.users)
    .set({ preferences: JSON.stringify(next) })
    .where(eq(schema.users.id, userId));
  return next;
}
