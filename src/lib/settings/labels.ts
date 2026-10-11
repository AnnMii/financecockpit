import type {
  AllSettings,
  NumberFieldName,
  SelectFieldName,
  SettingsScope,
  ToggleFieldName,
} from "./schema";

export interface FieldText {
  label: string;
  unit?: string;
  hint?: string;
}

export const scopeLabels: Record<SettingsScope, string> = {
  shared: "Globale Werte",
  "av-depot": "Altersvorsorgedepot",
  "pension-gap": "Rentenlücke",
  savings: "Sparrechner",
  "withdrawal-plan": "Entnahmeplan",
};

export const numberText: {
  [S in SettingsScope]: Record<NumberFieldName<S>, FieldText>;
} = {
  shared: {
    age: { label: "Alter", unit: "Jahre" },
    retirementAge: { label: "Renteneintritt mit", unit: "Jahren" },
    payoutUntilAge: {
      label: "Auszahlung bis Alter",
      unit: "Jahre",
      hint: "Bis zu diesem Alter soll das Geld reichen.",
    },
    savingsRateMonthly: { label: "Sparrate pro Monat", unit: "€" },
    currentCapital: {
      label: "Vorhandenes Kapital",
      unit: "€",
      hint: "Heute bereits angelegtes Vermögen.",
    },
    expectedReturn: {
      label: "Erwartete Rendite MSCI World",
      unit: "% p. a.",
      hint: "In der Sparphase, nach Fondskosten (TER), vor Steuern.",
    },
    retirementReturn: {
      label: "Rendite im Ruhestand",
      unit: "% p. a.",
      hint: "Erwartete Rendite während der Auszahlung.",
    },
    inflationRate: { label: "Inflationsrate", unit: "% p. a." },
    capitalGainsTax: {
      label: "Kapitalertragsteuer",
      unit: "%",
      hint: "25 % plus Solidaritätszuschlag; mit Kirchensteuer höher.",
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
  },
  "av-depot": {
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
  },
  "pension-gap": {
    statePension: {
      label: "Gesetzliche Rente",
      unit: "€ / Monat",
      hint: "Laut Renteninformation der Deutschen Rentenversicherung.",
    },
    companyPension: {
      label: "Betriebliche Altersvorsorge",
      unit: "€ / Monat",
    },
    privatePension: {
      label: "Private Renten-/Lebensversicherung",
      unit: "€ / Monat",
    },
    riesterPension: { label: "Riester-/Rürup-Rente", unit: "€ / Monat" },
    taxPrediction: {
      label: "Geschätzter Steuerabzug",
      unit: "%",
      hint: "Auf die Rente oberhalb des Grundfreibetrags und auf Zinsen im Ruhestand.",
    },
    yearlyTaxFreeAmount: {
      label: "Steuerlicher Grundfreibetrag",
      unit: "€ / Jahr",
    },
    desiredPension: {
      label: "Monatliche Wunschrente",
      unit: "€ / Monat",
      hint: "Netto, was du im Ruhestand zur Verfügung haben möchtest.",
    },
  },
  savings: {
    durationYears: { label: "Laufzeit", unit: "Jahre" },
    endValue: { label: "Endkapital", unit: "€" },
    partialExemption: {
      label: "Teilfreistellungsquote",
      unit: "%",
      hint: "30 % bei Aktienfonds, 15 % bei Mischfonds.",
    },
  },
  "withdrawal-plan": {
    capitalAssets: { label: "Anlagevermögen", unit: "€" },
    withdrawalAmount: { label: "Entnahmebetrag", unit: "€" },
    periodYears: { label: "Entnahmezeitraum", unit: "Jahre" },
  },
};

export const toggleText: {
  [S in SettingsScope]: Record<ToggleFieldName<S>, FieldText>;
} = {
  shared: {
    considerInflation: {
      label: "Inflation berücksichtigen",
      hint: "Rechnet mit Renditen nach Abzug der Inflationsrate.",
    },
  },
  "av-depot": {},
  "pension-gap": {},
  savings: {
    considerTax: { label: "Steuern mitberechnen" },
    considerPartialExemption: {
      label: "Teilfreistellung bei Fonds berücksichtigen",
    },
  },
  "withdrawal-plan": {
    capitalConsumption: {
      label: "Kapitalverzehr",
      hint: "Aus: Es werden nur die Zinsen entnommen, das Kapital bleibt erhalten.",
    },
  },
};

type OptionLabels<S extends SettingsScope, K extends SelectFieldName<S>> = Record<
  AllSettings[S][K] & string,
  string
>;

export const selectText: {
  [S in SettingsScope]: {
    [K in SelectFieldName<S>]: FieldText & { options: OptionLabels<S, K> };
  };
} = {
  shared: {},
  "av-depot": {
    taxSavingsMode: {
      label: "Verwendung der Steuerersparnis",
      options: {
        avDepot: "Ins AV-Depot einzahlen",
        secondaryDepot: "In einem separaten Depot anlegen",
        consume: "Konsumieren",
      },
    },
  },
  "pension-gap": {},
  savings: {
    output: {
      label: "Was möchtest du berechnen?",
      options: {
        endValue: "Endkapital",
        startValue: "Anfangskapital",
        yearlyInterest: "Zinssatz",
        duration: "Laufzeit",
        savingRate: "Sparrate",
      },
    },
    saveInterval: {
      label: "Sparintervall",
      options: { monthly: "monatlich", yearly: "jährlich" },
    },
    interestInterval: {
      label: "Zinsintervall",
      options: {
        monthly: "monatlich",
        quarterly: "vierteljährlich",
        yearly: "jährlich",
      },
    },
    distributionType: {
      label: "Ausschüttungsart",
      options: { distributing: "ausschüttend", accumulating: "thesaurierend" },
    },
  },
  "withdrawal-plan": {
    output: {
      label: "Was möchtest du berechnen?",
      options: {
        amount: "Entnahmebetrag",
        period: "Entnahmezeitraum",
        capital: "Anlagevermögen",
      },
    },
    interval: {
      label: "Entnahmeintervall",
      options: {
        monthly: "monatlich",
        quarterly: "vierteljährlich",
        biannual: "halbjährlich",
        yearly: "jährlich",
      },
    },
  },
};
