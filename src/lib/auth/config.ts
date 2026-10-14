// Set ALLOW_REGISTRATION=false once the app is hosted and all accounts exist.
export function registrationAllowed(): boolean {
  return process.env.ALLOW_REGISTRATION !== "false";
}

/** Why signing in or registering failed; texts are in src/lib/i18n. */
export type AuthError =
  | "missingCredentials"
  | "wrongCredentials"
  | "registrationClosed"
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordMismatch"
  | "emailTaken"
  | "tooManyAttempts";
