"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";
import {
  type AllSettings,
  SETTINGS_SCOPES,
  type SettingsScope,
} from "@/lib/settings/schema";
import type { ProfileError } from "@/lib/settings/labels";
import { useLocale } from "./locale-provider";
import {
  type SettingsEditor,
  SettingsEditorContext,
  useSettings,
} from "./settings-provider";

type Overrides = Partial<Record<SettingsScope, Record<string, unknown>>>;

/** Where the changed shared values go: an existing profile or a new one. */
export type SharedTarget = { profileId: string } | { newName: string };

interface DraftControls {
  /** Number of values that differ from the saved profiles. */
  changedCount: number;
  /** Whether any of them are shared values. */
  sharedChanged: boolean;
  /**
   * Writes the local values into profiles: calculator values into the profile
   * in use, shared values into `sharedTarget` (default: the one in use), which
   * then becomes the shared profile in use. Returns why it failed, or null.
   */
  save: (sharedTarget?: SharedTarget) => Promise<ProfileError | null>;
  /** Drops the local values and returns to the saved profiles. */
  reset: () => void;
  /** Drops the local values of one scope, e.g. after switching its profile. */
  resetScope: (scope: SettingsScope) => void;
}

const DraftContext = createContext<DraftControls | null>(null);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const hasChanges = (changes: Record<string, unknown> | undefined) =>
  changes !== undefined && Object.keys(changes).length > 0;

/**
 * Lets the fields inside work on a local copy of the settings. Changes apply
 * immediately to everything below, but reach the account only through `save`;
 * a reload or `reset` brings the saved profiles back.
 */
export function DraftSettings({ children }: { children: React.ReactNode }) {
  const {
    settings: saved,
    profiles,
    update: saveToActive,
    updateProfile,
    selectProfile,
    createProfile,
  } = useSettings();
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
  const sharedChanged = hasChanges(overrides.shared);

  const save = useCallback<DraftControls["save"]>(
    async (sharedTarget) => {
      const sharedChanges = overrides.shared as
        | Partial<AllSettings["shared"]>
        | undefined;

      // The new profile first: if its name is refused, nothing is saved yet.
      if (hasChanges(sharedChanges) && sharedTarget && "newName" in sharedTarget) {
        const error = await createProfile(
          "shared",
          sharedTarget.newName,
          editor.settings.shared,
        );
        if (error) return error;
      } else if (hasChanges(sharedChanges)) {
        const activeId = profiles.shared.activeId;
        const targetId =
          sharedTarget && "profileId" in sharedTarget
            ? sharedTarget.profileId
            : activeId;
        updateProfile("shared", targetId, sharedChanges!);
        if (targetId !== activeId) selectProfile("shared", targetId);
      }

      for (const scope of SETTINGS_SCOPES) {
        const changes = overrides[scope];
        if (scope !== "shared" && hasChanges(changes)) {
          saveToActive(scope, changes as Partial<AllSettings[typeof scope]>);
        }
      }
      setOverrides({});
      return null;
    },
    [
      overrides,
      editor,
      profiles,
      saveToActive,
      updateProfile,
      selectProfile,
      createProfile,
    ],
  );

  const reset = useCallback(() => setOverrides({}), []);
  const resetScope = useCallback(
    (scope: SettingsScope) =>
      setOverrides((previous) => ({ ...previous, [scope]: {} })),
    [],
  );

  const controls = useMemo(
    () => ({ changedCount, sharedChanged, save, reset, resetScope }),
    [changedCount, sharedChanged, save, reset, resetScope],
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

const NEW_PROFILE = "__new__";

/**
 * Floating panel in the bottom right corner with the buttons to save or
 * discard the local changes. Only shown while there are any. When shared
 * values changed, it asks which shared profile they should go to.
 */
export function DraftBar() {
  const draft = useDraft();
  if (!draft) throw new Error("DraftBar must be used inside DraftSettings");
  const { changedCount, sharedChanged, save, reset } = draft;

  const id = useId();
  const { t } = useLocale();
  const text = t.draft;
  const { profiles } = useSettings();
  const { activeId, profiles: sharedProfiles } = profiles.shared;
  // null means: the shared profile in use, whichever that is at the moment.
  const [choice, setChoice] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<ProfileError | null>(null);
  const [busy, setBusy] = useState(false);

  if (changedCount === 0) return null;

  const stillExists = sharedProfiles.some((profile) => profile.id === choice);
  const target = choice === NEW_PROFILE || stillExists ? choice! : activeId;
  const targetName = sharedProfiles.find((p) => p.id === target)?.name;

  const clear = () => {
    setChoice(null);
    setNewName("");
    setError(null);
  };

  const submit = async () => {
    setBusy(true);
    const failure = await save(
      !sharedChanged
        ? undefined
        : target === NEW_PROFILE
          ? { newName }
          : { profileId: target },
    );
    setBusy(false);
    if (failure) setError(failure);
    else clear();
  };

  return (
    <form
      role="status"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="fixed bottom-4 right-4 z-20 max-w-[calc(100vw-2rem)] rounded-xl border border-accent bg-accent-wash p-4 shadow-lg sm:w-80"
    >
      <p className="text-sm text-ink">
        <strong className="font-semibold">
          {text.changes(changedCount)}
        </strong>{" "}
        {text.notSaved}
      </p>

      {sharedChanged && (
        <div className="mt-3">
          <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-2">
            {text.saveSharedIn}
          </label>
          <select
            id={id}
            value={target}
            onChange={(event) => {
              setChoice(event.target.value);
              setError(null);
            }}
            className="w-full rounded-md border border-axis bg-surface px-3 py-1.5 text-sm text-ink"
          >
            {sharedProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
                {profile.id === activeId ? ` ${text.active}` : ""}
              </option>
            ))}
            <option value={NEW_PROFILE}>{text.newProfile}</option>
          </select>

          {target === NEW_PROFILE ? (
            <>
              <input
                autoFocus
                required
                value={newName}
                maxLength={40}
                onChange={(event) => setNewName(event.target.value)}
                aria-label={text.newNamePlaceholder}
                placeholder={text.newNamePlaceholder}
                className="mt-2 w-full rounded-md border border-axis bg-surface px-3 py-1.5 text-sm text-ink"
              />
              <p className="mt-1 text-xs text-ink-2">
                {text.newProfileHint}
              </p>
            </>
          ) : (
            target !== activeId && (
              <p className="mt-1 text-xs text-ink-2">
                {text.otherProfileHint(targetName ?? "")}
              </p>
            )
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-critical">
          {t.profiles.errors[error]}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent disabled:opacity-60"
        >
          {text.save}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            clear();
          }}
          className="rounded-md border border-axis bg-surface px-3 py-1.5 text-sm text-ink"
        >
          {text.reset}
        </button>
      </div>
    </form>
  );
}
