// Set ALLOW_REGISTRATION=false once the app is hosted and all accounts exist.
export function registrationAllowed(): boolean {
  return process.env.ALLOW_REGISTRATION !== "false";
}
