"use client";

import { formatEuro } from "@/lib/format";
import {
  type AvDepotSettings,
  MAX_CHILDREN,
  type SharedSettings,
  TAX_SAVINGS_MODES,
  type TaxSavingsMode,
  avDepotFields,
  childBirthYearSpec,
  sharedFields,
} from "@/lib/settings/schema";
import { NumberField, SharedBadge } from "./fields";
import { useSettings } from "./settings-provider";

interface FieldText {
  label: string;
  unit?: string;
  hint?: string;
}

const sharedText: Record<keyof typeof sharedFields, FieldText> = {
  age: { label: "Alter", unit: "Jahre" },
  retirementAge: { label: "Renteneintritt mit", unit: "Jahren" },
  savingsRateMonthly: { label: "Sparrate pro Monat", unit: "€" },
  expectedReturn: {
    label: "Erwartete Rendite MSCI World",
    unit: "% p. a.",
    hint: "Nach Fondskosten (TER), vor Steuern.",
  },
  zveSavingsPhase: {
    label: "Einkommen in der Ansparphase",
    unit: "€ / Jahr",
    hint: "Zu versteuerndes Einkommen pro Jahr.",
  },
  zveRetirement: {
    label: "Einkommen im Ruhestand",
    unit: "€ / Jahr",
    hint: "Zu versteuerndes Einkommen pro Jahr, ohne die Auszahlungen.",
  },
  exemptionOrder: {
    label: "Sparerpauschbetrag",
    unit: "€ / Jahr",
    hint: "Der Teil, der für diese Geldanlage noch frei ist.",
  },
};

const avDepotText: Record<keyof typeof avDepotFields, FieldText> = {
  avDepotCosts: {
    label: "Kosten des AV-Depots",
    unit: "% p. a.",
    hint: "Zusätzlich zu den Fondskosten, z. B. Depotgebühr.",
  },
  baseRate: {
    label: "Basiszins",
    unit: "%",
    hint: "Für die Vorabpauschale im normalen Depot.",
  },
  oneTimePayout: {
    label: "Einmalauszahlung bei Renteneintritt",
    unit: "%",
    hint: "Bis zu 30 % des Kapitals, brutto.",
  },
  payoutReturnRate: {
    label: "Rendite in der Auszahlphase",
    unit: "% p. a.",
  },
  payoutUntilAge: { label: "Auszahlung bis Alter", unit: "Jahre" },
};

const taxSavingsModeText: Record<TaxSavingsMode, string> = {
  avDepot: "Ins AV-Depot einzahlen",
  secondaryDepot: "In einem separaten Depot anlegen",
  consume: "Konsumieren",
};

export function SharedField({
  name,
  hint,
}: {
  name: keyof typeof sharedFields;
  hint?: React.ReactNode;
}) {
  const { settings, update } = useSettings();
  const text = sharedText[name];
  return (
    <NumberField
      label={text.label}
      unit={text.unit}
      hint={hint ?? text.hint}
      spec={sharedFields[name]}
      value={settings.shared[name]}
      onChange={(value) =>
        update("shared", { [name]: value } as Partial<SharedSettings>)
      }
      shared
    />
  );
}

export function AvDepotField({ name }: { name: keyof typeof avDepotFields }) {
  const { settings, update } = useSettings();
  const text = avDepotText[name];
  return (
    <NumberField
      label={text.label}
      unit={text.unit}
      hint={text.hint}
      spec={avDepotFields[name]}
      value={settings["av-depot"][name]}
      onChange={(value) =>
        update("av-depot", { [name]: value } as Partial<AvDepotSettings>)
      }
    />
  );
}

export function TaxSavingsModeField() {
  const { settings, update } = useSettings();
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">
        Verwendung der Steuerersparnis
      </span>
      <select
        value={settings["av-depot"].taxSavingsMode}
        onChange={(event) =>
          update("av-depot", {
            taxSavingsMode: event.target.value as TaxSavingsMode,
          })
        }
        className="w-full rounded-md border border-axis bg-surface px-3 py-2 text-sm text-ink"
      >
        {TAX_SAVINGS_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {taxSavingsModeText[mode]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ChildrenField() {
  const { settings, update } = useSettings();
  const years = settings.shared.childBirthYears;
  const setYears = (childBirthYears: number[]) =>
    update("shared", { childBirthYears });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">Kinder</span>
        <SharedBadge />
      </div>
      {years.length === 0 && (
        <p className="text-xs text-ink-2">Keine Kinder eingetragen.</p>
      )}
      {years.map((year, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1">
            <NumberField
              label={`Geburtsjahr Kind ${index + 1}`}
              spec={childBirthYearSpec}
              value={year}
              onChange={(value) =>
                setYears(years.map((y, i) => (i === index ? value : y)))
              }
            />
          </div>
          <button
            type="button"
            onClick={() => setYears(years.filter((_, i) => i !== index))}
            className="mt-6 rounded-md border border-axis px-3 py-2 text-sm text-ink-2 hover:text-ink"
            aria-label={`Kind ${index + 1} entfernen`}
          >
            Entfernen
          </button>
        </div>
      ))}
      {years.length < MAX_CHILDREN && (
        <button
          type="button"
          onClick={() => setYears([...years, childBirthYearSpec.default])}
          className="rounded-md border border-axis px-3 py-2 text-sm font-medium text-ink hover:bg-accent-wash"
        >
          Kind hinzufügen
        </button>
      )}
    </div>
  );
}

/** "= 1.800 € pro Jahr" under the monthly savings rate. */
export function yearlySavingsHint(monthly: number): string {
  return `= ${formatEuro(monthly * 12)} pro Jahr`;
}
