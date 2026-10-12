"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createProfileAction,
  deleteProfileAction,
  loadProfilesAction,
  renameProfileAction,
  saveProfileDataAction,
  setActiveProfileAction,
} from "@/app/actions/settings";
import {
  type AllSettings,
  SETTINGS_SCOPES,
  type SettingsScope,
} from "@/lib/settings/schema";
import type { ProfileError } from "@/lib/settings/labels";
import type { Profile, ProfileState } from "@/lib/settings/store";
import { notifyTabs, useTabSync } from "./tab-sync";

export type SaveState = "idle" | "saving" | "saved" | "error";

type Update = <S extends SettingsScope>(
  scope: S,
  patch: Partial<AllSettings[S]>,
) => void;

interface SettingsContextValue {
  /** Values of the profiles in use, one per scope. */
  settings: AllSettings;
  profiles: ProfileState;
  /** Changes values of the profile in use and saves them shortly after. */
  update: Update;
  /** Like `update`, for any profile of the scope, in use or not. */
  updateProfile: <S extends SettingsScope>(
    scope: S,
    profileId: string,
    patch: Partial<AllSettings[S]>,
  ) => void;
  selectProfile: (scope: SettingsScope, profileId: string) => void;
  /** These three return why they failed, or null when they succeeded. */
  createProfile: <S extends SettingsScope>(
    scope: S,
    name: string,
    data: AllSettings[S],
  ) => Promise<ProfileError | null>;
  renameProfile: (
    scope: SettingsScope,
    profileId: string,
    name: string,
  ) => Promise<ProfileError | null>;
  deleteProfile: (
    scope: SettingsScope,
    profileId: string,
  ) => Promise<ProfileError | null>;
  saveState: SaveState;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * What input fields read and write. By default these are the saved settings;
 * <DraftSettings> swaps in a local draft that is only saved on request.
 */
export interface SettingsEditor {
  settings: AllSettings;
  update: Update;
  /** True when a value differs from what is saved in the account. */
  isChanged: (scope: SettingsScope, key: string) => boolean;
}

export const SettingsEditorContext = createContext<SettingsEditor | null>(null);

// One scope's profiles without the per-scope value types, for generic updates.
type ScopeProfiles = { activeId: string; profiles: Profile[] };

const SAVE_DELAY_MS = 500;
const FAILED: ProfileError = "failed";

function activeSettings(state: ProfileState): AllSettings {
  return Object.fromEntries(
    SETTINGS_SCOPES.map((scope) => {
      const { activeId, profiles } = state[scope];
      const active = profiles.find((p) => p.id === activeId) ?? profiles[0];
      return [scope, active.data];
    }),
  ) as AllSettings;
}

export function SettingsProvider({
  initialProfiles,
  children,
}: {
  initialProfiles: ProfileState;
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const latest = useRef(initialProfiles);
  // Pending saves, by profile id.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Requests on their way, and a count of local changes: what was fetched
  // before one of them must not overwrite it.
  const inFlight = useRef(0);
  const changes = useRef(0);

  /** Replaces the profile list of one scope. */
  const setScope = useCallback(
    (scope: SettingsScope, change: (current: ScopeProfiles) => ScopeProfiles) => {
      changes.current++;
      latest.current = {
        ...latest.current,
        [scope]: change(latest.current[scope] as ScopeProfiles),
      } as ProfileState;
      setProfiles(latest.current);
    },
    [],
  );

  const report = useCallback(async <T extends { ok: boolean }>(
    request: Promise<T>,
  ): Promise<T | null> => {
    setSaveState("saving");
    inFlight.current++;
    try {
      const result = await request;
      // A newer change is already waiting; its own save reports the outcome.
      if (timers.current.size === 0) setSaveState(result.ok ? "saved" : "error");
      if (result.ok) notifyTabs("settings");
      return result;
    } catch {
      setSaveState("error");
      return null;
    } finally {
      inFlight.current--;
    }
  }, []);

  /** Takes over what another tab (or browser) saved; never over own unsaved changes. */
  const refresh = useCallback(async () => {
    const busy = () => timers.current.size > 0 || inFlight.current > 0;
    if (busy()) return;
    const seen = changes.current;
    const fresh = await loadProfilesAction().catch(() => null);
    if (!fresh || busy() || changes.current !== seen) return;
    // Equal data must not cause a new render and with it new calculations.
    if (JSON.stringify(fresh) === JSON.stringify(latest.current)) return;
    latest.current = fresh;
    setProfiles(fresh);
  }, []);
  useTabSync("settings", refresh);

  const save = useCallback(
    (scope: SettingsScope, profileId: string) => {
      timers.current.delete(profileId);
      const profile = latest.current[scope].profiles.find((p) => p.id === profileId);
      if (profile) void report(saveProfileDataAction(profileId, profile.data));
    },
    [report],
  );

  const updateProfile = useCallback<SettingsContextValue["updateProfile"]>(
    (scope, profileId, patch) => {
      setScope(scope, (current) => ({
        ...current,
        profiles: current.profiles.map((p) =>
          p.id === profileId ? { ...p, data: { ...p.data, ...patch } } : p,
        ),
      }));

      clearTimeout(timers.current.get(profileId));
      timers.current.set(
        profileId,
        setTimeout(() => save(scope, profileId), SAVE_DELAY_MS),
      );
    },
    [save, setScope],
  );

  const update = useCallback<Update>(
    (scope, patch) =>
      updateProfile(scope, latest.current[scope].activeId, patch),
    [updateProfile],
  );

  const selectProfile = useCallback<SettingsContextValue["selectProfile"]>(
    (scope, profileId) => {
      setScope(scope, (current) => ({ ...current, activeId: profileId }));
      void report(setActiveProfileAction(profileId));
    },
    [report, setScope],
  );

  const createProfile = useCallback<SettingsContextValue["createProfile"]>(
    async (scope, name, data) => {
      const result = await report(createProfileAction(scope, name, data));
      if (!result) return FAILED;
      if (!result.ok) return result.error;
      setScope(scope, (current) => ({
        activeId: result.profile.id,
        profiles: [...current.profiles, result.profile],
      }));
      return null;
    },
    [report, setScope],
  );

  const renameProfile = useCallback<SettingsContextValue["renameProfile"]>(
    async (scope, profileId, name) => {
      const result = await report(renameProfileAction(profileId, name));
      if (!result) return FAILED;
      if (!result.ok) return result.error;
      setScope(scope, (current) => ({
        ...current,
        profiles: current.profiles.map((p) =>
          p.id === profileId ? { ...p, name: result.name } : p,
        ),
      }));
      return null;
    },
    [report, setScope],
  );

  const deleteProfile = useCallback<SettingsContextValue["deleteProfile"]>(
    async (scope, profileId) => {
      clearTimeout(timers.current.get(profileId));
      timers.current.delete(profileId);
      const result = await report(deleteProfileAction(profileId));
      if (!result) return FAILED;
      if (!result.ok) return result.error;
      setScope(scope, (current) => ({
        activeId: result.activeId,
        profiles: current.profiles.filter((p) => p.id !== profileId),
      }));
      return null;
    },
    [report, setScope],
  );

  // Leaving the page within the delay would otherwise drop the last change.
  useEffect(() => {
    const pending = timers.current;
    const flush = () => {
      for (const [profileId, timer] of pending) {
        clearTimeout(timer);
        const scope = SETTINGS_SCOPES.find((s) =>
          latest.current[s].profiles.some((p) => p.id === profileId),
        );
        if (scope) save(scope, profileId);
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [save]);

  const value = useMemo(
    () => ({
      settings: activeSettings(profiles),
      profiles,
      update,
      updateProfile,
      selectProfile,
      createProfile,
      renameProfile,
      deleteProfile,
      saveState,
    }),
    [
      profiles,
      update,
      updateProfile,
      selectProfile,
      createProfile,
      renameProfile,
      deleteProfile,
      saveState,
    ],
  );
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside a SettingsProvider");
  }
  return context;
}

export function useSettingsEditor(): SettingsEditor {
  const editor = useContext(SettingsEditorContext);
  const saved = useSettings();
  return (
    editor ?? {
      settings: saved.settings,
      update: saved.update,
      isChanged: () => false,
    }
  );
}
