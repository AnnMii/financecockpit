"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { isSettingsScope } from "@/lib/settings/schema";
import {
  type Profile,
  type ProfileResult,
  type ProfileState,
  createProfile,
  deleteProfile,
  loadProfiles,
  renameProfile,
  saveProfileData,
  setActiveProfile,
} from "@/lib/settings/store";

const SIGNED_OUT = { ok: false, error: "signedOut" } as const;

/** All profiles of the signed-in user, for tabs that catch up with a change. */
export async function loadProfilesAction(): Promise<ProfileState | null> {
  const user = await getCurrentUser();
  return user ? loadProfiles(user.id, user.access) : null;
}

export async function saveProfileDataAction(
  profileId: string,
  data: unknown,
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user || typeof profileId !== "string") return SIGNED_OUT;
  return saveProfileData(user.id, profileId, data, user.access);
}

export async function createProfileAction(
  scope: string,
  name: string,
  data: unknown,
): Promise<ProfileResult<{ profile: Profile }>> {
  const user = await getCurrentUser();
  if (!user || !isSettingsScope(scope) || typeof name !== "string") {
    return SIGNED_OUT;
  }
  return createProfile(user.id, scope, name, data, user.access);
}

export async function renameProfileAction(
  profileId: string,
  name: string,
): Promise<ProfileResult<{ name: string }>> {
  const user = await getCurrentUser();
  if (!user || typeof profileId !== "string" || typeof name !== "string") {
    return SIGNED_OUT;
  }
  return renameProfile(user.id, profileId, name);
}

export async function deleteProfileAction(
  profileId: string,
): Promise<ProfileResult<{ activeId: string }>> {
  const user = await getCurrentUser();
  if (!user || typeof profileId !== "string") return SIGNED_OUT;
  return deleteProfile(user.id, profileId);
}

export async function setActiveProfileAction(
  profileId: string,
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user || typeof profileId !== "string") return SIGNED_OUT;
  return setActiveProfile(user.id, profileId);
}
