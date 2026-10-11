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
import { saveSettingsAction } from "@/app/actions/settings";
import type { AllSettings, SettingsScope } from "@/lib/settings/schema";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface SettingsContextValue {
  settings: AllSettings;
  /** Changes values of one scope and saves them to the account shortly after. */
  update: <S extends SettingsScope>(
    scope: S,
    patch: Partial<AllSettings[S]>,
  ) => void;
  saveState: SaveState;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const SAVE_DELAY_MS = 500;

export function SettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: AllSettings;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const latest = useRef(initialSettings);
  const timers = useRef(new Map<SettingsScope, ReturnType<typeof setTimeout>>());

  const save = useCallback(async (scope: SettingsScope) => {
    timers.current.delete(scope);
    setSaveState("saving");
    try {
      const result = await saveSettingsAction(scope, latest.current[scope]);
      // A newer change is already waiting; its own save reports the outcome.
      if (timers.current.size > 0) return;
      setSaveState(result.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }, []);

  const update = useCallback<SettingsContextValue["update"]>(
    (scope, patch) => {
      latest.current = {
        ...latest.current,
        [scope]: { ...latest.current[scope], ...patch },
      };
      setSettings(latest.current);

      clearTimeout(timers.current.get(scope));
      timers.current.set(
        scope,
        setTimeout(() => save(scope), SAVE_DELAY_MS),
      );
    },
    [save],
  );

  // Leaving the page within the delay would otherwise drop the last change.
  useEffect(() => {
    const pending = timers.current;
    const flush = () => {
      for (const [scope, timer] of pending) {
        clearTimeout(timer);
        void save(scope);
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [save]);

  const value = useMemo(
    () => ({ settings, update, saveState }),
    [settings, update, saveState],
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
