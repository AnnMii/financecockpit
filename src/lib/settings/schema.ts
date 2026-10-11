import { z } from "zod";

/**
 * Settings are stored per user and per scope. The "shared" scope holds the
 * values every calculator reads (age, savings rate, expected return, ...);
 * each calculator adds a scope of its own for the inputs only it needs.
 *
 * To add a calculator: add its fields and scope here, then build its page
 * on top of `useSettings()`.
 */

export interface NumberFieldSpec {
  min: number;
  max: number;
  default: number;
  integer?: boolean;
}

export const sharedFields = {
  age: { min: 18, max: 80, default: 35, integer: true },
  retirementAge: { min: 60, max: 75, default: 67, integer: true },
  savingsRateMonthly: { min: 0, max: 100_000, default: 150 },
  /** Expected yearly return of the MSCI World after fund costs, in percent. */
  expectedReturn: { min: 0.1, max: 20, default: 6 },
  /** Taxable income (zvE) per year while saving / in retirement. */
  zveSavingsPhase: { min: 0, max: 10_000_000, default: 50_000 },
  zveRetirement: { min: 0, max: 10_000_000, default: 20_000 },
  /** Sparerpauschbetrag still available for these savings. */
  exemptionOrder: { min: 0, max: 2_000, default: 1_000 },
} satisfies Record<string, NumberFieldSpec>;

export const avDepotFields = {
  avDepotCosts: { min: 0, max: 5, default: 0.2 },
  baseRate: { min: 0, max: 10, default: 0 },
  oneTimePayout: { min: 0, max: 30, default: 0 },
  payoutReturnRate: { min: 0.1, max: 15, default: 3 },
  payoutUntilAge: { min: 85, max: 120, default: 85, integer: true },
} satisfies Record<string, NumberFieldSpec>;

export const MAX_CHILDREN = 5;
export const childBirthYearSpec = {
  min: 1990,
  max: 2100,
  default: 2020,
  integer: true,
} satisfies NumberFieldSpec;

export const TAX_SAVINGS_MODES = ["avDepot", "secondaryDepot", "consume"] as const;
export type TaxSavingsMode = (typeof TAX_SAVINGS_MODES)[number];

// Every field falls back to its default on its own, so one broken stored
// value never discards the rest of a user's settings.
function numberField(spec: NumberFieldSpec) {
  const base = spec.integer ? z.number().int() : z.number();
  return base.min(spec.min).max(spec.max).catch(spec.default);
}

function numberFields<T extends Record<string, NumberFieldSpec>>(fields: T) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, spec]) => [key, numberField(spec)]),
  ) as { [K in keyof T]: ReturnType<typeof numberField> };
}

const sharedSchema = z.object({
  ...numberFields(sharedFields),
  childBirthYears: z
    .array(
      z.number().int().min(childBirthYearSpec.min).max(childBirthYearSpec.max),
    )
    .max(MAX_CHILDREN)
    .catch([]),
});

const avDepotSchema = z.object({
  ...numberFields(avDepotFields),
  taxSavingsMode: z.enum(TAX_SAVINGS_MODES).catch("avDepot"),
});

export const settingsSchemas = {
  shared: sharedSchema,
  "av-depot": avDepotSchema,
} as const;

export type SettingsScope = keyof typeof settingsSchemas;
export type SharedSettings = z.infer<typeof sharedSchema>;
export type AvDepotSettings = z.infer<typeof avDepotSchema>;
export type AllSettings = {
  [S in SettingsScope]: z.infer<(typeof settingsSchemas)[S]>;
};

export const SETTINGS_SCOPES = Object.keys(settingsSchemas) as SettingsScope[];

export function isSettingsScope(value: unknown): value is SettingsScope {
  return typeof value === "string" && value in settingsSchemas;
}

export function parseSettings<S extends SettingsScope>(
  scope: S,
  data: unknown,
): AllSettings[S] {
  const input = typeof data === "object" && data !== null ? data : {};
  return settingsSchemas[scope].parse(input) as AllSettings[S];
}

export function defaultSettings(): AllSettings {
  return {
    shared: parseSettings("shared", {}),
    "av-depot": parseSettings("av-depot", {}),
  };
}
