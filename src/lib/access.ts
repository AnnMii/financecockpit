import type { AllSettings, SettingsScope } from "@/lib/settings/schema";

/**
 * Who may do what. Two roles, plus a beta flag that an admin switches on per
 * account. Admins have the beta features too, so they can try what they hand
 * out. All checks that matter run on the server; hiding a link or a field in
 * the interface is only for convenience.
 */
export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

export interface Access {
  role: Role;
  /** Whether the features that are still in beta are unlocked. */
  beta: boolean;
}

export function accessOf(user: { role: string; betaAccess: boolean }): Access {
  const role: Role = isRole(user.role) ? user.role : "user";
  return { role, beta: role === "admin" || user.betaAccess };
}

/** What everybody else gets: the calculator's output is fixed to the first, simplest one. */
const WITHOUT_BETA: Partial<{ [S in SettingsScope]: Partial<AllSettings[S]> }> = {
  savings: { output: "endValue" },
  "withdrawal-plan": { output: "amount" },
};

/**
 * Settings as the account may use them: without beta access the beta-only
 * choices fall back to their default. Applied when settings are loaded and
 * when they are saved, so a stored value can never open a locked feature.
 */
export function restrictSettings<S extends SettingsScope>(
  scope: S,
  data: AllSettings[S],
  access: Access,
): AllSettings[S] {
  if (access.beta) return data;
  const locked = WITHOUT_BETA[scope];
  return locked ? { ...data, ...locked } : data;
}
