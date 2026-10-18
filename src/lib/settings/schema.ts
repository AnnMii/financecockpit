import { z } from "zod";

// Zod otherwise probes for eval(), which the strict Content-Security-Policy
// (next.config.ts) reports as a violation although the probe is caught.
z.config({ jitless: true });

/**
 * Settings are stored per user in profiles, one list of profiles per scope.
 * The "shared" scope holds the values several calculators read (age, savings
 * rate, expected return, ...); each calculator has a scope of its own for the
 * inputs only it needs.
 *
 * To add a calculator: add its scope and fields here, their texts in both
 * dictionaries (src/lib/i18n), then build its page on top of
 * `useSettingsEditor()`.
 */

export interface NumberFieldSpec {
  min: number;
  max: number;
  default: number;
  integer?: boolean;
}

const euro = (defaultValue: number, max = 100_000_000): NumberFieldSpec => ({
  min: 0,
  max,
  default: defaultValue,
});
const percent = (defaultValue: number, max = 100): NumberFieldSpec => ({
  min: 0,
  max,
  default: defaultValue,
});

export const numberFields = {
  shared: {
    age: { min: 18, max: 80, default: 35, integer: true },
    retirementAge: { min: 60, max: 75, default: 67, integer: true },
    /** Until which age the savings have to last. */
    payoutUntilAge: { min: 68, max: 120, default: 85, integer: true },
    /** What can be invested per month in all; the calculators split it. */
    investableMonthly: euro(300, 1_000_000),
    currentCapital: euro(0),
    /** Expected yearly return while saving (on the invested capital, before costs and taxes). */
    expectedReturn: percent(6, 20),
    /** Expected yearly return in retirement. */
    retirementReturn: percent(3, 20),
    inflationRate: percent(2, 20),
    /** Capital gains tax including the solidarity surcharge. */
    capitalGainsTax: percent(26.375),
    /** Taxable income (zvE) per year while saving / in retirement. */
    taxableIncomeSavingsPhase: euro(50_000, 10_000_000),
    taxableIncomeRetirement: euro(20_000, 10_000_000),
    /** Sparerpauschbetrag still available for these savings. */
    exemptionOrder: euro(1_000, 2_000),
  },
  "av-depot": {
    /** Per month into the AV-Depot: 150 € is the subsidy limit, 1.140 € the maximum. */
    savingsRateMonthly: euro(150, 1_140),
    avDepotCosts: percent(0.2, 5),
    baseRate: percent(0, 10),
    oneTimePayout: percent(0, 30),
  },
  "pension-gap": {
    statePension: euro(950, 100_000),
    companyPension: euro(100, 100_000),
    privatePension: euro(0, 100_000),
    riesterPension: euro(0, 100_000),
    taxPrediction: percent(15, 99),
    yearlyTaxFreeAmount: euro(12_348, 1_000_000),
    desiredPension: euro(2_200, 1_000_000),
  },
  savings: {
    /** Per month into the savings plan, which is the ETF depot. */
    savingsRateMonthly: euro(150, 100_000),
    /** Costs per year, fund costs (TER) and fees together; deducted from the return. */
    costs: percent(0, 5),
    // Used when the duration does not follow the retirement age.
    durationYears: { min: 1, max: 100, default: 30, integer: true },
    // Above what the default plan reaches anyway, so every searched figure
    // has a meaningful answer.
    endValue: euro(250_000, 1_000_000_000),
    partialExemption: percent(30),
  },
  "withdrawal-plan": {
    capitalAssets: euro(100_000, 1_000_000_000),
    withdrawalAmount: euro(1_200, 100_000_000),
    periodYears: { min: 1, max: 100, default: 10, integer: true },
  },
  /** The Gesamtplan, see src/lib/plan. */
  plan: {
    /** Per month into the savings account. */
    cashMonthly: euro(0, 100_000),
    cashReturn: percent(2, 10),
    /** Yearly fluctuation of the returns. */
    depotVolatility: percent(15, 50),
    cashVolatility: percent(1, 10),
    /** Share of courses that has to reach the goal, and when to act. */
    confidenceTarget: { min: 50, max: 99, default: 85 },
    lowerGuardrail: { min: 1, max: 98, default: 75 },
    upperGuardrail: { min: 2, max: 100, default: 95 },
  },
} satisfies Record<string, Record<string, NumberFieldSpec>>;

export const toggleFields = {
  shared: { considerInflation: false },
  "av-depot": {},
  "pension-gap": {},
  savings: {
    untilRetirement: true,
    /** Deduct the inflation from the interest rate; all amounts in today's money. */
    realTerms: false,
    considerTax: false,
    considerPartialExemption: false,
  },
  "withdrawal-plan": {
    capitalConsumption: true,
    considerTax: false,
    /** Deduct the inflation from the return; all amounts in today's money. */
    realTerms: false,
  },
  /** Show the plan's amounts at retirement in future euros. */
  plan: {
    nominalView: false,
    /** Whether the plan saves into an AV-Depot / an ETF depot at all. */
    useAvDepot: true,
    useDepot: true,
  },
} satisfies Record<SettingsScope, Record<string, boolean>>;

/** Choice fields; the first option is the default. */
export const selectFields = {
  shared: {
    /** How the incomes are entered; they are stored per year either way. */
    incomeIntervalSavings: ["yearly", "monthly"],
    incomeIntervalRetirement: ["monthly", "yearly"],
  },
  "av-depot": {
    taxSavingsMode: ["avDepot", "secondaryDepot", "consume"],
  },
  "pension-gap": {},
  savings: {
    output: ["endValue", "startValue", "yearlyInterest", "duration", "savingRate"],
    saveInterval: ["monthly", "yearly"],
    interestInterval: ["monthly", "quarterly", "yearly"],
    distributionType: ["distributing", "accumulating"],
  },
  "withdrawal-plan": {
    output: ["amount", "period", "capital"],
    interval: ["monthly", "quarterly", "biannual", "yearly"],
  },
  plan: {},
} as const satisfies Record<SettingsScope, Record<string, readonly string[]>>;

export type SettingsScope = keyof typeof numberFields;
export const SETTINGS_SCOPES = Object.keys(numberFields) as SettingsScope[];

export const MAX_CHILDREN = 5;
export const childBirthYearSpec = {
  min: 1990,
  max: 2100,
  default: 2020,
  integer: true,
} satisfies NumberFieldSpec;

type Extras = {
  shared: { childBirthYears: number[] };
};

export type AllSettings = {
  [S in SettingsScope]: { [K in keyof (typeof numberFields)[S]]: number } & {
    [K in keyof (typeof toggleFields)[S]]: boolean;
  } & {
    [K in keyof (typeof selectFields)[S]]: (typeof selectFields)[S][K] extends readonly (infer O)[]
      ? O
      : never;
  } & (S extends keyof Extras ? Extras[S] : unknown);
};

export type TaxSavingsMode = AllSettings["av-depot"]["taxSavingsMode"];
export type NumberFieldName<S extends SettingsScope> = keyof (typeof numberFields)[S] & string;
export type ToggleFieldName<S extends SettingsScope> = keyof (typeof toggleFields)[S] & string;
export type SelectFieldName<S extends SettingsScope> = keyof (typeof selectFields)[S] & string;

// Every field falls back to its default on its own, so one broken stored
// value never discards the rest of a profile.
function scopeSchema(scope: SettingsScope) {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, spec] of Object.entries<NumberFieldSpec>(numberFields[scope])) {
    const base = spec.integer ? z.number().int() : z.number();
    shape[key] = base.min(spec.min).max(spec.max).catch(spec.default);
  }
  for (const [key, defaultValue] of Object.entries<boolean>(toggleFields[scope])) {
    shape[key] = z.boolean().catch(defaultValue);
  }
  for (const [key, options] of Object.entries<readonly string[]>(selectFields[scope])) {
    shape[key] = z.enum(options as [string, ...string[]]).catch(options[0]);
  }
  if (scope === "shared") {
    shape.childBirthYears = z
      .array(
        z.number().int().min(childBirthYearSpec.min).max(childBirthYearSpec.max),
      )
      .max(MAX_CHILDREN)
      .catch([]);
  }
  return z.object(shape);
}

const settingsSchemas = Object.fromEntries(
  SETTINGS_SCOPES.map((scope) => [scope, scopeSchema(scope)]),
) as Record<SettingsScope, ReturnType<typeof scopeSchema>>;

export function isSettingsScope(value: unknown): value is SettingsScope {
  return typeof value === "string" && value in numberFields;
}

/** Validates stored or submitted values; unknown keys are dropped. */
export function parseSettings<S extends SettingsScope>(
  scope: S,
  data: unknown,
): AllSettings[S] {
  const input = typeof data === "object" && data !== null ? data : {};
  return settingsSchemas[scope].parse(input) as AllSettings[S];
}

export function defaultSettings(): AllSettings {
  return Object.fromEntries(
    SETTINGS_SCOPES.map((scope) => [scope, parseSettings(scope, {})]),
  ) as AllSettings;
}
