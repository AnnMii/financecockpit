"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  type AllSettings,
  SETTINGS_SCOPES,
  type SettingsScope,
} from "@/lib/settings/schema";
import {
  type SettingsEditor,
  SettingsEditorContext,
  useSettings,
} from "./settings-provider";

type Overrides = Partial<Record<SettingsScope, Record<string, unknown>>>;

interface DraftControls {
  /** Number of values that differ from the saved profiles. */
  changedCount: number;
  /** Writes the local values into the profiles in use. */
  save: () => void;
  /** Drops the local values and returns to the saved profiles. */
  reset: () => void;
  /** Drops the local values of one scope, e.g. after switching its profile. */
  resetScope: (scope: SettingsScope) => void;
}

const DraftContext = createContext<DraftControls | null>(null);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Lets the fields inside work on a local copy of the settings. Changes apply
 * immediately to everything below, but reach the account only through `save`;
 * a reload or `reset` brings the saved profiles back.
 */
export function DraftSettings({ children }: { children: React.ReactNode }) {
  const { settings: saved, update: saveToProfile } = useSettings();
  const [overrides, setOverrides] = useState<Overrides>({});

  const editor = useMemo<SettingsEditor>(() => {
    const settings = Object.fromEntries(
      SETTINGS_SCOPES.map((scope) => [
        scope,
        { ...saved[scope], ...overrides[scope] },
      ]),
    ) as AllSettings;

    return {
      settings,
      update: (scope, patch) =>
        setOverrides((previous) => {
          const next: Record<string, unknown> = { ...previous[scope], ...patch };
          const savedScope = saved[scope] as Record<string, unknown>;
          // A value set back to the saved one is no longer a local change.
          for (const key of Object.keys(next)) {
            if (same(next[key], savedScope[key])) delete next[key];
          }
          return { ...previous, [scope]: next };
        }),
      isChanged: (scope, key) => key in (overrides[scope] ?? {}),
    };
  }, [saved, overrides]);

  const changedCount = SETTINGS_SCOPES.reduce(
    (count, scope) => count + Object.keys(overrides[scope] ?? {}).length,
    0,
  );

  const save = useCallback(() => {
    for (const scope of SETTINGS_SCOPES) {
      const changes = overrides[scope];
      if (changes && Object.keys(changes).length > 0) {
        saveToProfile(scope, changes as Partial<AllSettings[typeof scope]>);
      }
    }
    setOverrides({});
  }, [overrides, saveToProfile]);

  const reset = useCallback(() => setOverrides({}), []);
  const resetScope = useCallback(
    (scope: SettingsScope) =>
      setOverrides((previous) => ({ ...previous, [scope]: {} })),
    [],
  );

  const controls = useMemo(
    () => ({ changedCount, save, reset, resetScope }),
    [changedCount, save, reset, resetScope],
  );

  return (
    <SettingsEditorContext value={editor}>
      <DraftContext value={controls}>{children}</DraftContext>
    </SettingsEditorContext>
  );
}

/** The draft around the caller, or null on pages that save directly. */
export function useDraft(): DraftControls | null {
  return useContext(DraftContext);
}

/**
 * Floating panel in the bottom right corner with the buttons to save or
 * discard the local changes. Only shown while there are any.
 */
export function DraftBar() {
  const draft = useDraft();
  if (!draft) throw new Error("DraftBar must be used inside DraftSettings");
  const { changedCount, save, reset } = draft;
  if (changedCount === 0) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-20 max-w-[calc(100vw-2rem)] rounded-xl border border-accent bg-accent-wash p-4 shadow-lg sm:w-80"
    >
      <p className="text-sm text-ink">
        <strong className="font-semibold">
          {changedCount === 1
            ? "1 lokale Änderung"
            : `${changedCount} lokale Änderungen`}
        </strong>{" "}
        – nur in dieser Ansicht, nicht gespeichert.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
        >
          Im Profil speichern
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-axis bg-surface px-3 py-1.5 text-sm text-ink"
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}
