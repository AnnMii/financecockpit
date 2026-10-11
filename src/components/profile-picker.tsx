"use client";

import { useId, useState } from "react";
import { scopeLabels } from "@/lib/settings/labels";
import type { SettingsScope } from "@/lib/settings/schema";
import { useDraft } from "./draft-settings";
import { useSettings, useSettingsEditor } from "./settings-provider";

type Mode = "idle" | "create" | "rename" | "delete";

const buttonClass =
  "rounded-md border border-axis px-2.5 py-1 text-xs text-ink hover:bg-accent-wash disabled:opacity-40";
const primaryButtonClass =
  "rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent disabled:opacity-60";

/**
 * Chooses the profile in use for one scope. With `manage`, profiles can also
 * be created (from the values currently on screen), renamed and deleted.
 */
export function ProfilePicker({
  scope,
  label = scopeLabels[scope],
  manage = false,
}: {
  scope: SettingsScope;
  label?: string;
  manage?: boolean;
}) {
  const id = useId();
  const { profiles, selectProfile, createProfile, renameProfile, deleteProfile } =
    useSettings();
  const { settings: visible } = useSettingsEditor();
  const draft = useDraft();

  const [mode, setMode] = useState<Mode>("idle");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { activeId, profiles: list } = profiles[scope];
  const active = list.find((p) => p.id === activeId) ?? list[0];

  const open = (next: Mode, initialName = "") => {
    setMode(next);
    setName(initialName);
    setError(null);
  };

  const run = async (
    action: () => Promise<string | null>,
    profileReplaced = true,
  ) => {
    setBusy(true);
    const failure = await action();
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    // The profile in use changed: it now holds what is on screen (new
    // profile) or is a different one (after deleting).
    if (profileReplaced) draft?.resetScope(scope);
    open("idle");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-2">
        {label}
      </label>
      <select
        id={id}
        value={active.id}
        onChange={(event) => {
          selectProfile(scope, event.target.value);
          draft?.resetScope(scope);
          open("idle");
        }}
        className="w-full rounded-md border border-axis bg-surface px-3 py-2 text-sm text-ink"
      >
        {list.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>

      {manage && mode === "idle" && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={buttonClass} onClick={() => open("create")}>
            Neu …
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => open("rename", active.name)}
          >
            Umbenennen
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={list.length < 2}
            onClick={() => open("delete")}
          >
            Löschen
          </button>
        </div>
      )}

      {manage && (mode === "create" || mode === "rename") && (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void (mode === "create"
              ? run(() => createProfile(scope, name, visible[scope]))
              : run(() => renameProfile(scope, active.id, name), false));
          }}
        >
          <input
            autoFocus
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            aria-label={mode === "create" ? "Name des neuen Profils" : "Neuer Name"}
            placeholder="Name des Profils"
            className="w-full rounded-md border border-axis bg-surface px-3 py-1.5 text-sm text-ink"
          />
          {mode === "create" && (
            <p className="text-xs text-ink-2">
              Übernimmt die Werte, die du gerade siehst.
            </p>
          )}
          <div className="flex gap-1.5">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              {mode === "create" ? "Anlegen" : "Umbenennen"}
            </button>
            <button type="button" className={buttonClass} onClick={() => open("idle")}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {manage && mode === "delete" && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-ink">
            Profil „{active.name}“ endgültig löschen?
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy}
              onClick={() => void run(() => deleteProfile(scope, active.id))}
            >
              Löschen
            </button>
            <button type="button" className={buttonClass} onClick={() => open("idle")}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs text-critical">
          {error}
        </p>
      )}
    </div>
  );
}

/** The two pickers every calculator shows: shared values and its own. */
export function CalculatorProfiles({ scope }: { scope: SettingsScope }) {
  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-2">
        Profile
      </h2>
      <ProfilePicker scope="shared" manage />
      <ProfilePicker scope={scope} label="Werte dieses Rechners" manage />
    </section>
  );
}
