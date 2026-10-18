/**
 * Interface choices that belong to the account rather than to a profile: they
 * apply at once, are not part of the drafts and follow the user to every device.
 */
export interface Preferences {
  /** The "Advanced inputs" switch, shared by all forms that have one. */
  advancedInputs: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = { advancedInputs: false };

/** Reads stored JSON; anything unknown or malformed falls back to the default. */
export function parsePreferences(raw: unknown): Preferences {
  const data = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  return { advancedInputs: data.advancedInputs === true };
}
