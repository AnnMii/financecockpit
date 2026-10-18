"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { setAdvancedInputsAction } from "@/app/actions/preferences";
import type { Preferences } from "@/lib/preferences";

const PreferencesContext = createContext<Preferences | null>(null);
const SetAdvancedContext = createContext<((value: boolean) => void) | null>(null);

export function PreferencesProvider({
  initial,
  children,
}: {
  initial: Preferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState(initial);

  const setAdvanced = useCallback((value: boolean) => {
    // Applies at once; saving in the background must not hold the form up.
    setPreferences((current) => ({ ...current, advancedInputs: value }));
    void setAdvancedInputsAction(value).catch(() => {
      // Offline or signed out: the choice still holds for this visit.
    });
  }, []);

  return (
    <PreferencesContext.Provider value={preferences}>
      <SetAdvancedContext.Provider value={setAdvanced}>
        {children}
      </SetAdvancedContext.Provider>
    </PreferencesContext.Provider>
  );
}

/** The "Advanced inputs" switch, remembered in the account. */
export function useAdvancedInputs(): [boolean, (value: boolean) => void] {
  const preferences = useContext(PreferencesContext);
  const set = useContext(SetAdvancedContext);
  if (!preferences || !set) {
    throw new Error("useAdvancedInputs needs a PreferencesProvider");
  }
  return [preferences.advancedInputs, set];
}
