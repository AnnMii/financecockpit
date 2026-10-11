import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { ProfileError } from "./labels";
import {
  type AllSettings,
  SETTINGS_SCOPES,
  type SettingsScope,
  isSettingsScope,
  parseSettings,
} from "./schema";

export const DEFAULT_PROFILE_NAME = "Standard";
export const MAX_PROFILES_PER_SCOPE = 20;
export const MAX_PROFILE_NAME_LENGTH = 40;

export interface Profile<S extends SettingsScope = SettingsScope> {
  id: string;
  name: string;
  data: AllSettings[S];
}

/** All profiles of a user, with the one in use per scope. */
export type ProfileState = {
  [S in SettingsScope]: { activeId: string; profiles: Profile<S>[] };
};

export type ProfileResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: ProfileError };

const { profiles } = schema;

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function cleanName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return trimmed.length >= 1 && trimmed.length <= MAX_PROFILE_NAME_LENGTH
    ? trimmed
    : null;
}

const NOT_FOUND = { ok: false, error: "notFound" } as const;

async function ownProfile(userId: string, profileId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  return row && isSettingsScope(row.scope)
    ? { ...row, scope: row.scope }
    : undefined;
}

async function scopeRows(userId: string, scope: SettingsScope) {
  const db = await getDb();
  return db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), eq(profiles.scope, scope)))
    .orderBy(asc(profiles.createdAt));
}

async function activate(userId: string, scope: SettingsScope, id: string) {
  const db = await getDb();
  const inScope = and(eq(profiles.userId, userId), eq(profiles.scope, scope));
  await db.update(profiles).set({ isActive: false }).where(inScope);
  await db
    .update(profiles)
    .set({ isActive: true })
    .where(and(inScope, eq(profiles.id, id)));
}

export async function loadProfiles(userId: string): Promise<ProfileState> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(asc(profiles.createdAt), asc(profiles.name));

  const state: Record<string, { activeId: string; profiles: Profile[] }> = {};
  for (const scope of SETTINGS_SCOPES) {
    const own = rows.filter((row) => row.scope === scope);

    if (own.length === 0) {
      const now = new Date();
      const created = {
        id: randomUUID(),
        userId,
        scope,
        name: DEFAULT_PROFILE_NAME,
        data: JSON.stringify(parseSettings(scope, {})),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(profiles).values(created).onConflictDoNothing();
      own.push(created);
    }

    state[scope] = {
      activeId: (own.find((row) => row.isActive) ?? own[0]).id,
      profiles: own.map((row) => ({
        id: row.id,
        name: row.name,
        data: parseSettings(scope, safeJson(row.data)),
      })),
    };
  }
  return state as ProfileState;
}

export async function saveProfileData(
  userId: string,
  profileId: string,
  data: unknown,
): Promise<ProfileResult> {
  const profile = await ownProfile(userId, profileId);
  if (!profile) return NOT_FOUND;

  const db = await getDb();
  await db
    .update(profiles)
    .set({
      data: JSON.stringify(parseSettings(profile.scope, data)),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profileId));
  return { ok: true };
}

/** Creates a profile from the given values and puts it in use. */
export async function createProfile(
  userId: string,
  scope: SettingsScope,
  name: string,
  data: unknown,
): Promise<ProfileResult<{ profile: Profile }>> {
  const cleaned = cleanName(name);
  if (!cleaned) return { ok: false, error: "nameLength" };

  const existing = await scopeRows(userId, scope);
  if (existing.length >= MAX_PROFILES_PER_SCOPE) {
    return { ok: false, error: "tooMany" };
  }
  if (existing.some((row) => row.name === cleaned)) {
    return { ok: false, error: "duplicateName" };
  }

  const db = await getDb();
  const now = new Date();
  const profile: Profile = {
    id: randomUUID(),
    name: cleaned,
    data: parseSettings(scope, data),
  };
  await db.insert(profiles).values({
    id: profile.id,
    userId,
    scope,
    name: cleaned,
    data: JSON.stringify(profile.data),
    isActive: false,
    createdAt: now,
    updatedAt: now,
  });
  await activate(userId, scope, profile.id);
  return { ok: true, profile };
}

export async function renameProfile(
  userId: string,
  profileId: string,
  name: string,
): Promise<ProfileResult<{ name: string }>> {
  const cleaned = cleanName(name);
  if (!cleaned) return { ok: false, error: "nameLength" };

  const profile = await ownProfile(userId, profileId);
  if (!profile) return NOT_FOUND;

  const siblings = await scopeRows(userId, profile.scope);
  if (siblings.some((row) => row.name === cleaned && row.id !== profileId)) {
    return { ok: false, error: "duplicateName" };
  }

  const db = await getDb();
  await db
    .update(profiles)
    .set({ name: cleaned, updatedAt: new Date() })
    .where(eq(profiles.id, profileId));
  return { ok: true, name: cleaned };
}

/** Deletes a profile; the last one of a scope always stays. */
export async function deleteProfile(
  userId: string,
  profileId: string,
): Promise<ProfileResult<{ activeId: string }>> {
  const profile = await ownProfile(userId, profileId);
  if (!profile) return NOT_FOUND;

  const remaining = (await scopeRows(userId, profile.scope)).filter(
    (row) => row.id !== profileId,
  );
  if (remaining.length === 0) {
    return { ok: false, error: "lastProfile" };
  }

  const db = await getDb();
  await db.delete(profiles).where(eq(profiles.id, profileId));

  const [stillActive] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        eq(profiles.userId, userId),
        eq(profiles.scope, profile.scope),
        eq(profiles.isActive, true),
      ),
    )
    .limit(1);
  const activeId = stillActive?.id ?? remaining[0].id;
  if (!stillActive) await activate(userId, profile.scope, activeId);
  return { ok: true, activeId };
}

export async function setActiveProfile(
  userId: string,
  profileId: string,
): Promise<ProfileResult> {
  const profile = await ownProfile(userId, profileId);
  if (!profile) return NOT_FOUND;
  await activate(userId, profile.scope, profileId);
  return { ok: true };
}
